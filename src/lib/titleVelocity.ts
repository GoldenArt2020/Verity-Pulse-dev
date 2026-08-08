import type { YouTubeVideoDetail } from "@/providers/youtube/types";

export interface VelocityRankedVideo extends YouTubeVideoDetail {
  viewsPerDay: number;
  ageDays: number;
}

/**
 * Floors age at 1 day so a video that's a few hours old doesn't produce an
 * inflated, unproven views/day spike at the top of the ranking.
 */
function ageDaysOf(publishedAt: string): number {
  const ms = Date.now() - new Date(publishedAt).getTime();
  return Math.max(ms / (1000 * 60 * 60 * 24), 1);
}

export function viewsPerDayOf(video: Pick<YouTubeVideoDetail, "viewCount" | "publishedAt">): number {
  return video.viewCount / ageDaysOf(video.publishedAt);
}

/**
 * Ranks videos by views-per-day (a real momentum/CTR proxy) instead of raw
 * view count, which wrongly favors old videos regardless of how well their
 * title is actually performing right now. A minimum view-count floor keeps
 * a handful of hours-old, barely-viewed videos from gaming the top of the
 * list with a noisy early spike.
 */
export function topByVelocity(
  videos: YouTubeVideoDetail[],
  opts: { limit: number; minViews?: number }
): VelocityRankedVideo[] {
  const minViews = opts.minViews ?? 1000;
  return videos
    .filter((v) => v.viewCount >= minViews && !!v.publishedAt)
    .map((v) => ({ ...v, viewsPerDay: viewsPerDayOf(v), ageDays: ageDaysOf(v.publishedAt) }))
    .sort((a, b) => b.viewsPerDay - a.viewsPerDay)
    .slice(0, opts.limit);
}

export function formatVelocityBlock(videos: VelocityRankedVideo[]): string {
  return videos
    .map((v, i) => {
      const vpd = Math.round(v.viewsPerDay).toLocaleString();
      const ageLabel = v.ageDays < 2 ? "<2 days old" : `${Math.round(v.ageDays)} days old`;
      return `${i + 1}. "${v.title}" — ${vpd} views/day (${v.viewCount.toLocaleString()} total, ${ageLabel})`;
    })
    .join("\n");
}