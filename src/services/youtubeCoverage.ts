import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";

/**
 * Returns the cached list of YouTube video titles already covering this
 * case. If never fetched before, runs one searchCaseVideos() call (100
 * YouTube API units — expensive) and caches the result on the `cases`
 * row permanently. Never re-searches once cached.
 */
export async function getOrFetchYouTubeCoverage(
  caseId: string,
  caseName: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data: caseRow, error: fetchError } = await supabase
    .from("cases")
    .select("youtube_titles, youtube_coverage_fetched_at")
    .eq("id", caseId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load case: ${fetchError.message}`);
  }

  if (caseRow?.youtube_coverage_fetched_at && caseRow.youtube_titles) {
    return caseRow.youtube_titles as string[];
  }

  if (!youtubeProvider.isConfigured()) {
    // No YouTube key available — return empty rather than blocking angle
    // generation entirely; the prompt will just have no coverage context.
    return [];
  }

  const videos = await youtubeProvider.searchCaseVideos(caseName, 50);
  const titles = videos.map((v) => v.title);

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      youtube_titles: titles,
      youtube_coverage_fetched_at: new Date().toISOString(),
    })
    .eq("id", caseId);

  if (updateError) {
    console.error("Failed to cache YouTube coverage:", updateError.message);
  }

  return titles;
}