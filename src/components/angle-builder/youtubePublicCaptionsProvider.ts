import type { TranscriptProvider, TranscriptFetchResult, TranscriptSegment } from "./types";

const WATCH_URL = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`;

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" when auto-generated rather than creator-uploaded
}

/**
 * `ytInitialPlayerResponse = {...};` is embedded directly in the public
 * watch-page HTML that any browser receives with no login — this walks
 * braces to find the object's true end rather than using a regex, since
 * the JSON can itself contain "};" sequences inside description text.
 */
function extractPlayerResponse(html: string): unknown | null {
  const marker = "ytInitialPlayerResponse = ";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + marker.length;
  if (html[jsonStart] !== "{") return null;

  let depth = 0;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        const candidate = html.slice(jsonStart, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const manualEnglish = tracks.find((t) => t.languageCode.startsWith("en") && t.kind !== "asr");
  if (manualEnglish) return manualEnglish;
  const autoEnglish = tracks.find((t) => t.languageCode.startsWith("en"));
  if (autoEnglish) return autoEnglish;
  const anyManual = tracks.find((t) => t.kind !== "asr");
  if (anyManual) return anyManual;
  return tracks[0];
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}

function parseJson3Captions(json: { events?: Json3Event[] }): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  for (const ev of json.events ?? []) {
    const text = (ev.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (!text) continue;
    segments.push({ start: (ev.tStartMs ?? 0) / 1000, duration: (ev.dDurationMs ?? 0) / 1000, text });
  }
  return segments;
}

/**
 * Reads the same caption text YouTube displays to any viewer who clicks
 * "CC" — no login, no auth token, no DRM or CAPTCHA involved. This is
 * NOT the official YouTube Data API (which can only return captions for
 * channels that granted OAuth access as owner/manager — it cannot return
 * a third party's captions at all, full stop). This reads publicly
 * displayed page data the same way any browser does loading the page.
 *
 * Deliberately conservative: any parsing failure at any stage returns
 * "unavailable" rather than guessing — per spec, a transcript is only
 * ever reported available when one was actually, successfully retrieved.
 */
export const youtubePublicCaptionsProvider: TranscriptProvider = {
  name: "youtube_public_captions",

  async fetchTranscript(videoId: string): Promise<TranscriptFetchResult> {
    const empty: TranscriptFetchResult = {
      status: "unavailable",
      language: null,
      segments: [],
      rawText: "",
      retrievedVia: "youtube_public_captions",
    };

    try {
      const pageRes = await fetch(WATCH_URL(videoId), {
        headers: { "User-Agent": DESKTOP_USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
      });
      if (!pageRes.ok) return empty;
      const html = await pageRes.text();

      const playerResponse = extractPlayerResponse(html) as
        | { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } } }
        | null;
      if (!playerResponse) return empty;

      const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      const track = pickBestTrack(tracks);
      if (!track) return empty;

      const captionRes = await fetch(`${track.baseUrl}&fmt=json3`, {
        headers: { "User-Agent": DESKTOP_USER_AGENT },
      });
      if (!captionRes.ok) return empty;

      const captionJson = await captionRes.json();
      const segments = parseJson3Captions(captionJson);
      if (segments.length === 0) return empty;

      return {
        status: "available",
        language: track.languageCode,
        segments,
        rawText: segments.map((s) => s.text).join(" "),
        retrievedVia: "youtube_public_captions",
      };
    } catch {
      return empty;
    }
  },
};