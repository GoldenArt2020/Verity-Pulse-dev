import { client } from "@/lib/dataClient";
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
 *   - no Channel record exists yet for this youtubeChannelId + user, OR
 *   - the cached DNA is older than REANALYSIS_INTERVAL_DAYS
 * This is the single Groq-touching step in the whole channel-connect flow.
 */
export async function getOrBuildChannelDNA(
  channelSummary: YouTubeChannelSummary,
  userProfileId: string
): Promise<ChannelDNA> {
  const existing = await client.models.Channel.list({
    filter: {
      youtubeChannelId: { eq: channelSummary.channelId },
      userProfileId: { eq: userProfileId },
    },
  });

  const existingChannel = existing.data?.[0];

  if (existingChannel?.channelDNA && existingChannel?.lastAnalyzed) {
    const ageDays =
      (Date.now() - new Date(existingChannel.lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < REANALYSIS_INTERVAL_DAYS) {
      return existingChannel.channelDNA as unknown as ChannelDNA;
    }
  }

  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate Creator DNA");
  }

  // Cheap: ~2 quota units for 50 videos (playlistItems + videos.list)
  const videos = await youtubeProvider.getChannelVideos(channelSummary.uploadsPlaylistId, 50);

  // ONE Groq call for the whole channel — never per-video
  const raw = await groqProvider.generateText(buildPrompt(channelSummary, videos), {
    temperature: 0.3,
    maxTokens: 1200,
  });

  const parsed = parseDNAResponse(raw);
  const dna: ChannelDNA = { ...parsed, generatedAt: new Date().toISOString() };

  const commonFields = {
    channelName: channelSummary.title,
    subscriberCount: channelSummary.subscriberCount,
    videoCount: channelSummary.videoCount,
    viewCount: channelSummary.viewCount,
    channelDNA: dna,
    lastAnalyzed: new Date().toISOString(),
  };

  if (existingChannel) {
    await client.models.Channel.update({ id: existingChannel.id, ...commonFields });
  } else {
    await client.models.Channel.create({
      youtubeChannelId: channelSummary.channelId,
      userProfileId,
      ...commonFields,
    });
  }

  return dna;
}