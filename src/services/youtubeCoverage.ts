import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";

/**
 * Returns cached YouTube coverage videos (title + views + publish date) for
 * this case. If never fetched before, runs one searchCaseVideos() call (100
 * YouTube API units) and caches permanently on the `cases` row. Never
 * re-searches once cached.
 */
export async function getOrFetchYouTubeCoverage(
  caseId: string,
  caseName: string
): Promise<YouTubeVideoDetail[]> {
  const supabase = await createClient();

  const { data: caseRow, error: fetchError } = await supabase
    .from("cases")
    .select("youtube_coverage_videos, youtube_coverage_fetched_at")
    .eq("id", caseId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load case: ${fetchError.message}`);
  }

  if (caseRow?.youtube_coverage_fetched_at && caseRow.youtube_coverage_videos) {
    return caseRow.youtube_coverage_videos as YouTubeVideoDetail[];
  }

  if (!youtubeProvider.isConfigured()) {
    return [];
  }

  const videos = await youtubeProvider.searchCaseVideos(caseName, 50);

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      youtube_coverage_videos: videos,
      youtube_titles: videos.map((v) => v.title),
      youtube_coverage_fetched_at: new Date().toISOString(),
    })
    .eq("id", caseId);

  if (updateError) {
    console.error("Failed to cache YouTube coverage:", updateError.message);
  }

  return videos;
}