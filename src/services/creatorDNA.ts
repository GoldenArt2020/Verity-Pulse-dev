import { createClient } from "@/lib/supabase/client";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import { getOrFetchChannelVideos, saveLensTags } from "@/services/channelVideos";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

const REANALYSIS_INTERVAL_DAYS = 30; // never rebuild DNA automatically more than once/month

const LENS_IDS = [
  "victim-centered",
  "investigative",
  "systemic-failure",
  "family-impact",
  "courtroom",
] as const;

export interface LensPerformance {
  lens: (typeof LENS_IDS)[number];
  avgViewsRelativeToChannel: "above average" | "average" | "below average";
  videoCount: number;
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
  generatedAt: string;
}

function buildPrompt(channel: YouTubeChannelSummary, videos: { title: string; viewCount: number }[]): string {
  const videoList = videos
    .slice(0, 50)
    .map((v, i) => `${i + 1}. "${v.title}" — ${v.viewCount} views`)
    .join("\n");

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
  "videoLensTags": [{ "index": number, "lens": "victim-centered" | "investigative" | "systemic-failure" | "family-impact" | "courtroom" }]
}

CHANNEL: ${channel.title}
DESCRIPTION: ${channel.description.slice(0, 500)}
SUBSCRIBERS: ${channel.subscriberCount}
TOTAL VIDEOS: ${channel.videoCount}

RECENT VIDEOS (numbered, title — views):
${videoList}

Base "strengths" and "weaknesses" on inferred true-crime subgenres this channel's titles suggest the audience responds to well vs. poorly.

For "videoLensTags": classify EVERY numbered video above into exactly one of the 5 lens categories (victim-centered, investigative, systemic-failure, family-impact, courtroom), based on its title. Every video must get exactly one tag, using its list number as "index" (1-based, matching the numbers above).

Return ONLY the JSON object, nothing else.`;
}

interface RawDNAResponse extends Omit<ChannelDNA, "generatedAt" | "lensPerformance"> {
  videoLensTags: { index: number; lens: string }[];
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
 * Returns cached Creator DNA if it exists and is recent (<30 days old).
 * Only calls Groq (ONE batched call, not one per video) when:
 *   - no channels row exists yet for this youtube_channel_id + user, OR
 *   - the cached DNA is older than REANALYSIS_INTERVAL_DAYS
 * Raw per-video data (title/views, for lens-performance correlation) is
 * cached separately for 15 days via channelVideos.ts.
 */
export async function getOrBuildChannelDNA(
  channelSummary: YouTubeChannelSummary,
  userId: string
): Promise<ChannelDNA> {
  const supabase = createClient();

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

  // Need the channel's DB row id before we can cache raw videos against it.
  // If this is a brand-new channel (no existingChannel yet), insert a
  // placeholder row first so channel_videos has a valid FK target.
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

  const raw = await groqProvider.generateText(buildPrompt(channelSummary, cachedVideos), {
    temperature: 0.3,
    maxTokens: 1600,
  });

  const parsed = parseDNAResponse(raw);
  const lensPerformance = computeLensPerformance(cachedVideos, parsed.videoLensTags ?? []);

  const tagsToSave = (parsed.videoLensTags ?? [])
    .map((t) => {
      const video = cachedVideos[t.index - 1];
      return video ? { videoId: video.videoId, lens: t.lens } : null;
    })
    .filter((t): t is { videoId: string; lens: string } => t !== null);

  await saveLensTags(channelDbId, tagsToSave);

  const { videoLensTags, ...dnaFields } = parsed;
  const dna: ChannelDNA = { ...dnaFields, lensPerformance, generatedAt: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("channels")
    .update({
      channel_name: channelSummary.title,
      subscriber_count: channelSummary.subscriberCount,
      video_count: channelSummary.videoCount,
      view_count: channelSummary.viewCount,
      channel_dna: dna,
      last_analyzed: new Date().toISOString(),
    })
    .eq("id", channelDbId);
  if (updateError) throw new Error(`Failed to update channel: ${updateError.message}`);

  return dna;
}