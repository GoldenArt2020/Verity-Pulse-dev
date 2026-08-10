import type { YouTubeVideoDetail } from "@/providers/youtube/types";

export interface ChannelCoverageEntry {
  channelId: string;
  channelTitle: string;
  totalViews: number;
  videoCount: number;
}

export interface ChannelCoverageAnalysis {
  channels: ChannelCoverageEntry[];
  qualifyingChannelCount: number; // channels with 30k+ combined views on this case
  score: number; // 0-10, higher = more existing coverage = less fresh
  isOversaturated: boolean;
}

const QUALIFYING_VIEW_THRESHOLD = 30_000;
const OVERSATURATION_VIEW_THRESHOLD = 200_000;
const OVERSATURATION_CHANNEL_COUNT = 3; // 3+ channels past the view threshold = never suggest

/**
 * Groups a case's YouTube search results by channel and sums each channel's
 * total views on that case (a channel can have multiple videos about the
 * same case — those should count together, not as separate "coverage").
 * This replaces the old LLM-guessed 0-10 coverage estimate with a number
 * grounded in real fetched view counts.
 */
export function analyzeChannelCoverage(videos: YouTubeVideoDetail[]): ChannelCoverageAnalysis {
  const byChannel = new Map<string, ChannelCoverageEntry>();

  for (const v of videos) {
    const key = v.channelId || v.channelTitle || "unknown";
    const entry = byChannel.get(key) ?? {
      channelId: v.channelId,
      channelTitle: v.channelTitle || "Unknown channel",
      totalViews: 0,
      videoCount: 0,
    };
    entry.totalViews += v.viewCount;
    entry.videoCount += 1;
    byChannel.set(key, entry);
  }

  const channels = Array.from(byChannel.values()).sort((a, b) => b.totalViews - a.totalViews);

  const qualifyingChannelCount = channels.filter((c) => c.totalViews >= QUALIFYING_VIEW_THRESHOLD).length;
  const oversaturatedChannelCount = channels.filter((c) => c.totalViews > OVERSATURATION_VIEW_THRESHOLD).length;

  // Score climbs with how many channels have meaningfully covered this
  // case — doubling per qualifying channel, capped at 10, so a case with
  // 5+ channels past 30k views reads as fully saturated (10/10) and a
  // completely uncovered case reads as fresh (0/10).
  const score = Math.min(10, qualifyingChannelCount * 2);

  return {
    channels,
    qualifyingChannelCount,
    score,
    isOversaturated: oversaturatedChannelCount >= OVERSATURATION_CHANNEL_COUNT,
  };
}

export function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views.toLocaleString();
}