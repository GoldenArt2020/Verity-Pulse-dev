import { createClient } from "@/lib/supabase/client";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeChannelSummary, YouTubeVideoDetail } from "@/providers/youtube/types";

const REANALYSIS_INTERVAL_DAYS = 30; // never rebuild DNA automatically more than once/month

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
  generatedAt: string;
}

function buildPrompt(channel: YouTubeChannelSummary, videos: YouTubeVideoDetail[]): string {
  const videoList = videos
    .slice(0, 50)
    .map((v, i) => `${i + 1}. "${v.title}" — ${v.viewCount} views, ${Math.round(v.durationSeconds / 60)}min`)
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
  "weaknesses": string[]
}

CHANNEL: ${channel.title}
DESCRIPTION: ${channel.description.slice(0, 500)}
SUBSCRIBERS: ${channel.subscriberCount}
TOTAL VIDEOS: ${channel.videoCount}

RECENT VIDEOS (title — views, duration):
${videoList}

Base "strengths" and "weaknesses" on inferred true-crime subgenres (e.g. institutional failures, missing persons, cold cases, gang history, court recaps) that this channel's titles and topics suggest the audience responds to well vs. poorly. Return ONLY the JSON object, nothing else.`;
}

function parseDNAResponse(raw: string): Omit<ChannelDNA, "generatedAt"> {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Returns cached Creator DNA if it exists and is recent (<30 days old).
 * Only calls Groq (ONE batched call, not one per video) when:
 *   - no channels row exists yet for this youtube_channel_id + user, OR
 *   - the cached DNA is older than REANALYSIS_INTERVAL_DAYS
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

  const videos = await youtubeProvider.getChannelVideos(channelSummary.uploadsPlaylistId, 50);

  const raw = await groqProvider.generateText(buildPrompt(channelSummary, videos), {
    temperature: 0.3,
    maxTokens: 1200,
  });

  const parsed = parseDNAResponse(raw);
  const dna: ChannelDNA = { ...parsed, generatedAt: new Date().toISOString() };

  const commonFields = {
    channel_name: channelSummary.title,
    subscriber_count: channelSummary.subscriberCount,
    video_count: channelSummary.videoCount,
    view_count: channelSummary.viewCount,
    channel_dna: dna,
    last_analyzed: new Date().toISOString(),
  };

  if (existingChannel) {
    const { error: updateError } = await supabase
      .from("channels")
      .update(commonFields)
      .eq("id", existingChannel.id);
    if (updateError) throw new Error(`Failed to update channel: ${updateError.message}`);
  } else {
    const { error: insertError } = await supabase.from("channels").insert({
      youtube_channel_id: channelSummary.channelId,
      user_id: userId,
      ...commonFields,
    });
    if (insertError) throw new Error(`Failed to create channel: ${insertError.message}`);
  }

  return dna;
}