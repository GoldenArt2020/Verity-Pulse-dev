import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import { getOrFetchChannelVideos, saveLensTags } from "@/services/channelVideos";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";
import { CASE_TYPE_TAG_LIST_TEXT } from "@/lib/caseTypeTaxonomy";

const REANALYSIS_INTERVAL_DAYS = 30; // never rebuild DNA automatically more than once/month
const PRIMARY_REGION_THRESHOLD = 80; // % of content from one region before it's treated as the default filter

const LENS_IDS = [
  "victim-centered",
  "investigative",
  "systemic-failure",
  "family-impact",
  "courtroom",
] as const;

/** ISO 3166-1 alpha-2 -> readable region name, for the handful of
 * countries true-crime channels on this platform are realistically based
 * in. Falls back to the raw code if not in this list rather than guessing. */
const COUNTRY_CODE_NAMES: Record<string, string> = {
  GB: "United Kingdom",
  US: "United States",
  CA: "Canada",
  AU: "Australia",
  IE: "Ireland",
  NZ: "New Zealand",
  ZA: "South Africa",
};

function resolveCountryName(code: string | null): string | null {
  if (!code) return null;
  return COUNTRY_CODE_NAMES[code] ?? code;
}

export interface LensPerformance {
  lens: (typeof LENS_IDS)[number];
  avgViewsRelativeToChannel: "above average" | "average" | "below average";
  videoCount: number;
}

export interface RegionDistribution {
  distribution: Record<string, number>; // e.g. { "United Kingdom": 92, "United States": 5 }
  primaryRegion: string | null; // set only if one region crosses PRIMARY_REGION_THRESHOLD (or the channel's declared YouTube country was used as a fallback anchor)
  isMultiRegion: boolean; // true if no single region dominates and no declared country anchor was available — "Global English True Crime" per spec
  source: "content-evidence" | "channel-declared-country" | "user-declared" | "none"; // where primaryRegion came from, for debugging/transparency
}

export interface AudienceDNA {
  caseTypePreferences: string[]; // ranked, most-preferred first
  victimDemographicPreferences: {
    ethnicity: string | null;
    ageRange: string | null;
  };
  narrativeStyle: string;
  evidenceWeight: string[]; // e.g. ["Official Documents", "Bodycam", "Court Records"]
  contentFreshness: string; // e.g. "Recent Cases", "No strong preference"
}

export interface ChannelDNA {
  channelStyle: {
    storytellingStyle: string;
    averagePacing: string;
    preferredSubjects: string[];
    commonNarrativeStructures: string[];
    emotionalTone: string;
    typicalHooks: string[];
  };
  titleDNA: {
    averageLength: number;
    mostUsedWords: string[];
    curiosityPatterns: string[];
    emotionalWording: string[];
    formattingStyle: string;
  };
  strengths: string[];
  weaknesses: string[];
  lensPerformance: LensPerformance[];
  regionDistribution: RegionDistribution;
  audienceDNA: AudienceDNA;
  generatedAt: string;
}

function buildPrompt(
  channel: YouTubeChannelSummary,
  declaredCountryName: string | null,
  videos: { title: string; description: string; viewCount: number }[]
): string {
  const videoList = videos
    .slice(0, 50)
    .map((v, i) => {
      const desc = v.description?.trim();
      return `${i + 1}. "${v.title}" — ${v.viewCount} views${desc ? `\n   Description: ${desc}` : ""}`;
    })
    .join("\n");

  // A channel's biggest hits are the strongest signal of what it's
  // actually known for — much stronger than an average or most-recent
  // upload, which can easily be an off-brand experiment. This is a
  // supplementary, view-sorted summary alongside the main numbered list
  // above, not a replacement — videoLensTags below maps back to the main
  // list's indices, so that list's order can't change.
  const topByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
  const topPerformersBlock =
    topByViews.length > 0
      ? `\nTHIS CHANNEL'S TOP-PERFORMING VIDEOS BY VIEWS (weight these MOST heavily when determining regionDistribution — a channel's biggest cases are the strongest signal of what it's actually known for):\n${topByViews
          .map((v, i) => `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString()} views`)
          .join("\n")}\n`
      : "";

  const countryBlock = declaredCountryName
    ? `This channel's YouTube profile declares its country as: ${declaredCountryName}. Treat this as a strong prior for regionDistribution — it should usually be the dominant or sole region UNLESS the video titles/descriptions show clear, repeated, contradicting evidence (e.g. a channel set to "United States" whose videos consistently reference UK police forces, UK court terminology, UK locations). A single ambiguous or generic video title is NOT contradicting evidence.`
    : `This channel has not declared a country in its YouTube settings — infer regionDistribution purely from video titles/descriptions below, weighted heavily toward the top-performing videos listed. Do not default to "United States" as a fallback guess; if evidence is genuinely thin or absent across most videos, it is fine for the distribution to be uncertain/split rather than forced to one country.`;

  return `You are an editorial analyst for a true crime YouTube intelligence platform. Analyze this creator's channel and return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "channelStyle": {
    "storytellingStyle": string,
    "averagePacing": string,
    "preferredSubjects": string[],
    "commonNarrativeStructures": string[],
    "emotionalTone": string,
    "typicalHooks": string[]
  },
  "titleDNA": {
    "averageLength": number,
    "mostUsedWords": string[],
    "curiosityPatterns": string[],
    "emotionalWording": string[],
    "formattingStyle": string
  },
  "strengths": string[],
  "weaknesses": string[],
  "videoLensTags": [{ "index": number, "lens": "victim-centered" | "investigative" | "systemic-failure" | "family-impact" | "courtroom" }],
  "regionDistribution": object mapping country/region name to estimated percentage of this channel's content (percentages should sum to roughly 100), inferred from video titles/descriptions/subject matter — weight the TOP-PERFORMING videos listed separately below far more heavily than lower-view videos, since a channel's biggest cases are the strongest signal of what it's actually known for — e.g. { "United Kingdom": 92, "United States": 5, "Canada": 3 }. If a video's region genuinely can't be determined, exclude it from consideration rather than guessing.,
  "audienceDNA": {
    "caseTypePreferences": string[] (3-6 case types this audience engages with most, ranked most-preferred first — choose ONLY from this exact list so it can be matched against future case candidates: ${CASE_TYPE_TAG_LIST_TEXT}),
    "victimDemographicPreferences": {
      "ethnicity": string or null (only if a clear, consistent pattern is visible across titles — never guess from a single video),
      "ageRange": string or null (e.g. "adults", "children", "no strong pattern")
    },
    "narrativeStyle": string (e.g. "emotional documentary", "investigative procedural", "social commentary"),
    "evidenceWeight": string[] (types of evidence this channel's content tends to emphasize, e.g. "official documents", "court records", "witness testimony"),
    "contentFreshness": string (e.g. "recent/breaking cases", "historical cases", "mixed")
  }
}

CHANNEL: ${channel.title}
DESCRIPTION: ${channel.description.slice(0, 500)}
SUBSCRIBERS: ${channel.subscriberCount}
TOTAL VIDEOS: ${channel.videoCount}

${countryBlock}
${topPerformersBlock}
RECENT VIDEOS (numbered, title — views, with description excerpt where available):
${videoList}

Base "strengths" and "weaknesses" on inferred true-crime subgenres this channel's titles and topics suggest the audience responds to well vs. poorly.

For "videoLensTags": classify EVERY numbered video above into exactly one of the 5 lens categories (victim-centered, investigative, systemic-failure, family-impact, courtroom), based on its title. Every video must get exactly one tag, using its list number as "index" (1-based, matching the numbers above).

For "regionDistribution" and "audienceDNA": be conservative and evidence-based. Only infer demographic or regional patterns that are clearly and consistently supported by multiple video titles/descriptions — do not infer from a single data point, and leave fields null/empty rather than guessing when evidence is thin.

Return ONLY the JSON object, nothing else.`;
}

interface RawDNAResponse
  extends Omit<ChannelDNA, "generatedAt" | "lensPerformance" | "regionDistribution"> {
  videoLensTags: { index: number; lens: string }[];
  regionDistribution: Record<string, number>;
}

function parseDNAResponse(raw: string): RawDNAResponse {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/** Computes avg-views-relative-to-channel-average per lens, deterministically (no LLM math). */
function computeLensPerformance(
  videos: { viewCount: number }[],
  tags: { index: number; lens: string }[]
): LensPerformance[] {
  if (videos.length === 0) return [];

  const channelAvg = videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;

  const byLens = new Map<string, number[]>();
  for (const tag of tags) {
    const video = videos[tag.index - 1];
    if (!video) continue;
    if (!LENS_IDS.includes(tag.lens as any)) continue;
    if (!byLens.has(tag.lens)) byLens.set(tag.lens, []);
    byLens.get(tag.lens)!.push(video.viewCount);
  }

  return LENS_IDS.map((lens) => {
    const views = byLens.get(lens) ?? [];
    if (views.length === 0) {
      return { lens, avgViewsRelativeToChannel: "average" as const, videoCount: 0 };
    }
    const lensAvg = views.reduce((a, b) => a + b, 0) / views.length;
    const ratio = channelAvg > 0 ? lensAvg / channelAvg : 1;
    const avgViewsRelativeToChannel =
      ratio >= 1.15 ? "above average" : ratio <= 0.85 ? "below average" : "average";
    return { lens, avgViewsRelativeToChannel, videoCount: views.length };
  });
}

/**
 * Determines the single dominant region deterministically:
 *   1. If content evidence alone shows one region at/above the 80%
 *      threshold, trust it (this is the strongest possible signal — the
 *      content itself is consistently and clearly about one region).
 *   2. Otherwise, if the channel declared a country on YouTube, anchor to
 *      that instead of leaving the channel unclassified/multi-region —
 *      this is what fixes the "every ambiguous channel defaults to
 *      US-flavored guessing" problem, since most true-crime titles don't
 *      contain an explicit place name and previously had nothing else to
 *      anchor to.
 *   3. Only if NEITHER a clear content majority NOR a declared country
 *      exists does the channel fall back to true "multi-region" status.
 *
 * The >=80% threshold and the anchor logic are applied here in code, not
 * left to the model, so classification is consistent every time rather
 * than depending on how the LLM chooses to phrase its own conclusion.
 */
function resolveRegionDistribution(
  distribution: Record<string, number>,
  declaredCountryName: string | null
): RegionDistribution {
  const entries = Object.entries(distribution ?? {});

  if (entries.length > 0) {
    const [topRegion, topPct] = entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
    if (topPct >= PRIMARY_REGION_THRESHOLD) {
      return { distribution, primaryRegion: topRegion, isMultiRegion: false, source: "content-evidence" };
    }
  }

  if (declaredCountryName) {
    const mergedDistribution =
      entries.length > 0 ? distribution : { [declaredCountryName]: 100 };
    return {
      distribution: mergedDistribution,
      primaryRegion: declaredCountryName,
      isMultiRegion: false,
      source: "channel-declared-country",
    };
  }

  if (entries.length === 0) {
    return { distribution: {}, primaryRegion: null, isMultiRegion: false, source: "none" };
  }

  return { distribution, primaryRegion: null, isMultiRegion: true, source: "content-evidence" };
}

/**
 * Returns cached Creator DNA if it exists and is recent (<30 days old).
 * Only calls Groq (ONE batched call, not one per video) when:
 *   - no channels row exists yet for this youtube_channel_id + user, OR
 *   - the cached DNA is older than REANALYSIS_INTERVAL_DAYS
 * Raw per-video data (title/description/views, for lens-performance
 * correlation and region evidence) is cached separately for 15 days via
 * channelVideos.ts.
 *
 * This same call now also infers geographic distribution and Audience
 * DNA (case-type/demographic preferences, narrative style) — both feed
 * the recommendation engine's Geography and Audience DNA filters. Region
 * detection is anchored to the channel's own declared YouTube country
 * (channelSummary.country) whenever content evidence alone is
 * inconclusive — see resolveRegionDistribution for why.
 * channels.country is repurposed to store the resolved primaryRegion.
 */
export async function getOrBuildChannelDNA(
  channelSummary: YouTubeChannelSummary,
  userId: string
): Promise<ChannelDNA> {
  const supabase = await createClient();

  const { data: existingChannel, error: fetchError } = await supabase
    .from("channels")
    .select("*")
    .eq("youtube_channel_id", channelSummary.channelId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to check existing channel: ${fetchError.message}`);

  if (existingChannel?.channel_dna && existingChannel?.last_analyzed) {
    const ageDays =
      (Date.now() - new Date(existingChannel.last_analyzed).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < REANALYSIS_INTERVAL_DAYS) {
      return existingChannel.channel_dna as unknown as ChannelDNA;
    }
  }

  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate Creator DNA");
  }

  let channelDbId = existingChannel?.id as string | undefined;
  if (!channelDbId) {
    const { data: inserted, error: insertError } = await supabase
      .from("channels")
      .insert({
        youtube_channel_id: channelSummary.channelId,
        user_id: userId,
        channel_name: channelSummary.title,
        subscriber_count: channelSummary.subscriberCount,
        video_count: channelSummary.videoCount,
        view_count: channelSummary.viewCount,
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw new Error(`Failed to create channel row: ${insertError?.message}`);
    }
    channelDbId = inserted.id;
  }

  if (!channelDbId) {
    throw new Error("channelDbId was not set — this should never happen");
  }

  const cachedVideos = await getOrFetchChannelVideos(channelDbId, channelSummary);
  const declaredCountryName = resolveCountryName(channelSummary.country);

  const raw = await groqProvider.generateText(buildPrompt(channelSummary, declaredCountryName, cachedVideos), {
    temperature: 0.3,
    maxTokens: 2600,
  });

  const parsed = parseDNAResponse(raw);
  const lensPerformance = computeLensPerformance(cachedVideos, parsed.videoLensTags ?? []);

  // A user who explicitly set their channel's region (see
  // /api/channel/region) has final say — scheduled DNA regeneration
  // must never silently overwrite that with a fresh AI guess. Only
  // resolve from AI/declared-country when there's no active lock.
  const lockedRegion = (existingChannel?.channel_dna as { regionDistribution?: RegionDistribution } | null)
    ?.regionDistribution;
  const regionDistribution: RegionDistribution =
    existingChannel?.region_locked && lockedRegion
      ? lockedRegion
      : resolveRegionDistribution(parsed.regionDistribution ?? {}, declaredCountryName);

  const tagsToSave = (parsed.videoLensTags ?? [])
    .map((t) => {
      const video = cachedVideos[t.index - 1];
      return video ? { videoId: video.videoId, lens: t.lens } : null;
    })
    .filter((t): t is { videoId: string; lens: string } => t !== null);

  await saveLensTags(channelDbId, tagsToSave);

  const { videoLensTags, regionDistribution: _rawRegion, ...dnaFields } = parsed;
  const dna: ChannelDNA = {
    ...dnaFields,
    lensPerformance,
    regionDistribution,
    generatedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("channels")
    .update({
      channel_name: channelSummary.title,
      subscriber_count: channelSummary.subscriberCount,
      video_count: channelSummary.videoCount,
      view_count: channelSummary.viewCount,
      channel_dna: dna,
      region_distribution: regionDistribution,
      audience_dna: dna.audienceDNA,
      country: regionDistribution.primaryRegion,
      last_analyzed: new Date().toISOString(),
    })
    .eq("id", channelDbId);
  if (updateError) throw new Error(`Failed to update channel: ${updateError.message}`);

  return dna;
}