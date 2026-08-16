import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
/**
 * Deterministic competition score (0-100), derived purely from existing
 * YouTube coverage of this exact case — NOT general news/media coverage,
 * which is a different signal entirely. More existing videos means more
 * entrenched competition for a new creator covering the same story.
 * Scales to 100 at 20+ existing videos; beyond that, saturation is
 * effectively total regardless of the exact count.
 */
function computeCompetitionScore(videos: YouTubeVideoDetail[]): number {
  if (videos.length === 0) return 0;
  return Math.min(100, Math.round((videos.length / 20) * 100));
}

const GENRE_CACHE_DAYS = 7;

function slugifyGenreKey(category: string | null): string {
  if (!category) return "general";
  const slug = category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "general";
}

function buildGenreQueries(category: string | null): string[] {
  const queries = ["true crime documentary case explained", "unsolved murder mystery documentary"];
  if (category) {
    queries.unshift(`${category} true crime documentary`);
  }
  return queries;
}

/**
 * Broader, case-agnostic pool of currently high-momentum true crime titles —
 * used alongside (not instead of) case-specific coverage, so title
 * generation has strong reference formulas even for lesser-covered or
 * brand-new cases where case-specific search returns little or nothing.
 * Cached per category for 7 days (not permanently, unlike case-specific
 * coverage) since genre-wide trends genuinely shift week to week.
 */
export async function getOrFetchGenreBenchmarkTitles(category: string | null): Promise<YouTubeVideoDetail[]> {
  const supabase = await createClient();
  const genreKey = slugifyGenreKey(category);

  const { data: cached } = await supabase
    .from("genre_title_benchmarks")
    .select("videos, fetched_at")
    .eq("genre_key", genreKey)
    .maybeSingle();

  if (cached?.fetched_at) {
    const ageDays = (Date.now() - new Date(cached.fetched_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < GENRE_CACHE_DAYS) {
      return (cached.videos as YouTubeVideoDetail[]) ?? [];
    }
  }

  if (!youtubeProvider.isConfigured()) {
    return (cached?.videos as YouTubeVideoDetail[]) ?? [];
  }

  const queries = buildGenreQueries(category);
  const batches = await Promise.all(
    queries.map((q) => youtubeProvider.searchCaseVideos(q, 20).catch(() => []))
  );
  const videos = batches.flat();

  if (videos.length > 0) {
    await supabase
      .from("genre_title_benchmarks")
      .upsert(
        { genre_key: genreKey, videos, fetched_at: new Date().toISOString() },
        { onConflict: "genre_key" }
      );
  }

  return videos;
}

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
  const competitionScore = computeCompetitionScore(videos);

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      youtube_coverage_videos: videos,
      youtube_titles: videos.map((v) => v.title),
      youtube_coverage_fetched_at: new Date().toISOString(),
      competition_score: competitionScore,
    })
    .eq("id", caseId);

  if (updateError) {
    console.error("Failed to cache YouTube coverage:", updateError.message);
  }

  return videos;
}