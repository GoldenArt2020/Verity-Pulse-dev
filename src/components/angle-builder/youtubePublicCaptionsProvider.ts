import type { TranscriptProvider, TranscriptFetchResult, TranscriptSegment } from "./types";

const WATCH_URL = "https://www.youtube.com/watch?v=";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = auto-generated
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function extractCaptionTracks(watchPageHtml: string): CaptionTrack[] {
  const marker = '"captionTracks":';
  const idx = watchPageHtml.indexOf(marker);
  if (idx === -1) return [];

  const arrayStart = watchPageHtml.indexOf("[", idx);
  if (arrayStart === -1) return [];

  let depth = 0;
  let end = -1;
  for (let i = arrayStart; i < watchPageHtml.length; i++) {
    if (watchPageHtml[i] === "[") depth++;
    if (watchPageHtml[i] === "]") depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end === -1) return [];

  try {
    return JSON.parse(watchPageHtml.slice(arrayStart, end)) as CaptionTrack[];
  } catch {
    return [];
  }
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const english = tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr");
  if (english) return english;
  const englishAuto = tracks.find((t) => t.languageCode?.startsWith("en"));
  if (englishAuto) return englishAuto;
  return tracks[0];
}

function parseTimedText(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[3].replace(/<[^>]+>/g, "")).trim();
    if (!text) continue;
    segments.push({
      start: parseFloat(match[1]),
      duration: parseFloat(match[2]),
      text,
    });
  }
  return segments;
}

export const youtubePublicCaptionsProvider: TranscriptProvider = {
  name: "youtube-public-captions",

  async fetchTranscript(videoId: string): Promise<TranscriptFetchResult> {
    const empty: TranscriptFetchResult = {
      status: "unavailable",
      language: null,
      segments: [],
      rawText: "",
      retrievedVia: "youtube-public-captions",
    };

    try {
      const watchRes = await fetch(`${WATCH_URL}${videoId}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!watchRes.ok) return empty;

      const html = await watchRes.text();
      const tracks = extractCaptionTracks(html);
      const track = pickBestTrack(tracks);
      if (!track) return empty;

      const captionUrl = decodeHtmlEntities(track.baseUrl);
      const captionRes = await fetch(captionUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (!captionRes.ok) return empty;

      const xml = await captionRes.text();
      const segments = parseTimedText(xml);
      if (segments.length === 0) return empty;

      const rawText = segments.map((s) => s.text).join(" ");

      return {
        status: "available",
        language: track.languageCode ?? null,
        segments,
        rawText,
        retrievedVia: "youtube-public-captions",
      };
    } catch {
      return empty;
    }
  },
};