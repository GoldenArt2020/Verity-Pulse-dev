import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeVideoDetail, YouTubeChannelSummary } from "@/providers/youtube/types";

const FRESHNESS_DAYS = 15;
/** Descriptions are often where a creator states location explicitly
 * ("a small town in Yorkshire...") even when the title doesn't — kept
 * short since only the opening lines usually matter for this. */
const DESCRIPTION_CACHE_CHARS = 300;

export interface CachedVideo {
  videoId: string;
  title: string;
  description: string;
  viewCount: number;
  lens: string | null;
}

/**
 * Returns cached raw video list (title, description, views, lens tag) if
 * fetched within the last 15 days. Otherwise fetches fresh from YouTube,
 * stores it, and returns it with `lens: null` for all rows (lens tagging
 * happens separately in creatorDNA.ts, which owns the single Groq call).
 */
export async function getOrFetchChannelVideos(
  channelDbId: string,
  channelSummary: YouTubeChannelSummary
): Promise<CachedVideo[]> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("channel_videos")
    .select("video_id, title, view_count, lens, fetched_at")
    .eq("channel_id", channelDbId)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (fetchError) throw new Error(`Failed to check cached videos: ${fetchError.message}`);

  if (existing && existing.length > 0) {
    const ageDays = (Date.now() - new Date(existing[0].fetched_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < FRESHNESS_DAYS) {
      const { data: allCached } = await supabase
        .from("channel_videos")
        .select("video_id, title, description, view_count, lens")
        .eq("channel_id", channelDbId);

      return (allCached ?? []).map((v) => ({
        videoId: v.video_id,
        title: v.title,
        description: v.description ?? "",
        viewCount: v.view_count,
        lens: v.lens,
      }));
    }
  }

  const videos: YouTubeVideoDetail[] = await youtubeProvider.getChannelVideos(
    channelSummary.uploadsPlaylistId,
    50
  );

  await supabase.from("channel_videos").delete().eq("channel_id", channelDbId);

  const rows = videos.map((v) => ({
    channel_id: channelDbId,
    video_id: v.videoId,
    title: v.title,
    description: (v.description ?? "").slice(0, DESCRIPTION_CACHE_CHARS),
    view_count: v.viewCount,
    lens: null,
  }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("channel_videos").insert(rows);
    if (insertError) console.error("Failed to cache channel videos:", insertError.message);
  }

  return videos.map((v) => ({
    videoId: v.videoId,
    title: v.title,
    description: (v.description ?? "").slice(0, DESCRIPTION_CACHE_CHARS),
    viewCount: v.viewCount,
    lens: null,
  }));
}

/** Persists lens tags for already-cached videos, keyed by videoId. */
export async function saveLensTags(
  channelDbId: string,
  tags: { videoId: string; lens: string }[]
): Promise<void> {
  const supabase = await createClient();
  for (const tag of tags) {
    await supabase
      .from("channel_videos")
      .update({ lens: tag.lens })
      .eq("channel_id", channelDbId)
      .eq("video_id", tag.videoId);
  }
}