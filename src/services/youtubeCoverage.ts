import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";

const GENRE_CACHE_DAYS = 7;
const COVERAGE_CACHE_DAYS = 7;

// Major news outlets whose YouTube uploads shouldn't count as "creator
// competition" — a case getting picked up by CNN or Fox News is media
// attention, not another true-crime creator covering the same story.
// Matched case-insensitively as a substring against the channel title,
// so "Fox News" also catches "FOX 5 News", "Fox News Insider", etc.
// This is not exhaustive (local affiliate call-sign channels like WBRC
// or KHOU aren't caught) — add more outlets here as they show up in
// real results.
const NEWS_CHANNEL_BLOCKLIST = [
  "fox news",
  "cnn",
  "abc news",
  "nbc news",
  "cbs news",
  "msnbc",
  "bbc news",
  "sky news",
  "reuters",
  "associated press",
  "ap news",
  "newsnation",
  "global news",
  "ctv news",
  "cbc news",
  "usa today",
  "the sun",
  "daily mail",
  "inside edition",
  "entertainment tonight",
  "tmz",
  "people.com",
  "people magazine",
  "peopletv",
  "eyewitness news",
  "action news",
  "news 12",
  "wsvn",
  "wfaa",
  "khou",
  "wbrc",
];

function isNewsChannel(channelTitle: string | null | undefined): boolean {
  if (!channelTitle) return false;
  const lower = channelTitle.toLowerCase();
  return NEWS_CHANNEL_BLOCKLIST.some((outlet) => lower.includes(outlet));
}

/** Filters out news-outlet uploads so only actual creator coverage remains. */
function filterToCreatorVideos(videos: YouTubeVideoDetail[]): YouTubeVideoDetail[] {
  return videos.filter((v) => !isNewsChannel(v.channelTitle));
}

/**
 * Deterministic competition score (0-100), derived purely from existing
 * CREATOR YouTube coverage of this exact case — news-outlet uploads are
 * excluded before this ever runs (see filterToCreatorVideos), so this is
 * never inflated by media attention. Scales to 100 at 50+ existing
 * creator videos; beyond that, saturation is effectively total
 * regardless of the exact count.
 */
function computeCompetitionScore(creatorVideos: YouTubeVideoDetail[]): number {
  if (creatorVideos.length === 0) return 0;
  return Math.min(100, Math.round((creatorVideos.length / 50) * 100));
}

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
  const videos = filterToCreatorVideos(batches.flat());

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
 * this case — news-outlet channels filtered out, so only actual creator
 * coverage counts. If never fetched before, runs one searchCaseVideos()
 * call (100 YouTube API units) and caches permanently on the `cases` row,
 * including a deterministic competition_score computed from the filtered
 * result. Never re-searches once cached.
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

  const isFresh =
    caseRow?.youtube_coverage_fetched_at &&
    (Date.now() - new Date(caseRow.youtube_coverage_fetched_at).getTime()) / (1000 * 60 * 60 * 24) < COVERAGE_CACHE_DAYS;

  if (isFresh && caseRow.youtube_coverage_videos) {
    return caseRow.youtube_coverage_videos as YouTubeVideoDetail[];
  }

  if (!youtubeProvider.isConfigured()) {
    return (caseRow?.youtube_coverage_videos as YouTubeVideoDetail[]) ?? [];
  }

  const [plainResults, qualifiedResults] = await Promise.all([
    youtubeProvider.searchCaseVideos(caseName, 50).catch(() => []),
    youtubeProvider.searchCaseVideos(`${caseName} true crime case`, 50).catch(() => []),
  ]);
  const seen = new Set<string>();
  const rawVideos = [...plainResults, ...qualifiedResults].filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
  const creatorVideos = filterToCreatorVideos(rawVideos);
  const competitionScore = computeCompetitionScore(creatorVideos);

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      youtube_coverage_videos: creatorVideos,
      youtube_titles: creatorVideos.map((v) => v.title),
      youtube_coverage_fetched_at: new Date().toISOString(),
      competition_score: competitionScore,
    })
    .eq("id", caseId);

  if (updateError) {
    console.error("Failed to cache YouTube coverage:", updateError.message);
  }

  return creatorVideos;
}