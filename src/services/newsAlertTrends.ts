import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";

export interface AlertTrendSignal {
  combinedScore: number; // 0-100
  trendStatus: "currently-trending" | "about-to-trend" | null;
  googleSignal: number; // 0-100
  youtubeSignal: number; // 0-100
}

const CURRENTLY_TRENDING_FLOOR = 65;
const ABOUT_TO_TREND_FLOOR = 40;
const RECENCY_WINDOW_DAYS = 7;
// A case that broke in the last 48h hasn't had TIME to accumulate
// search/YouTube momentum yet — that's not evidence it's unimportant,
// it's just math (no outlet or creator can build coverage of something
// that happened 6 hours ago). Since "about-to-trend" exists specifically
// to catch cases BEFORE they build buzz, requiring pre-existing momentum
// to qualify defeats its own purpose. This freshness path lets a
// genuinely new case qualify on recency alone when the momentum score
// hasn't caught up yet, rather than only ever catching cases that have
// already started trending under a different name.
const FRESHNESS_WINDOW_HOURS = 48;

/**
 * Computes a combined search-momentum signal for a news-alert case title,
 * blending two independent readings:
 *
 * - "Google" signal: how many DISTINCT recent (last 7 days) web sources are
 *   currently covering this case, via Tavily's news search — the closest
 *   proxy available here to general web/Google search attention, since no
 *   direct Google Trends API is integrated in this app.
 * - YouTube signal: recency-weighted view velocity from actual recent
 *   YouTube uploads about the case, via the YouTube Data API.
 *
 * This is a MOMENTUM/RECENCY signal, distinct from the pure saturation
 * check in youtubeCoverageAnalysis.ts (used elsewhere to filter out
 * over-covered cases). A case can have low total YouTube coverage but high
 * momentum right now — that's exactly an "about-to-trend" case — or high
 * total coverage with fresh momentum right now, which is
 * "currently-trending". A case with neither, AND that isn't itself
 * fresh-breaking news (see FRESHNESS_WINDOW_HOURS), returns
 * trendStatus: null and is filtered out of recommendations entirely by
 * the caller, staying in the /news-alerts manual review queue instead.
 *
 * @param publishedAt ISO timestamp of the underlying alert's original
 *   publish/detection time, if known. Used only for the freshness
 *   qualifying path below — omit to fall back to pure momentum scoring.
 */
export async function computeAlertTrendSignal(
  title: string,
  publishedAt?: string | null
): Promise<AlertTrendSignal> {
  const [googleSignal, youtubeSignal] = await Promise.all([
    computeGoogleSignal(title),
    computeYoutubeSignal(title),
  ]);

  const combinedScore = Math.round(googleSignal * 0.5 + youtubeSignal * 0.5);

  let trendStatus: "currently-trending" | "about-to-trend" | null = null;
  if (combinedScore >= CURRENTLY_TRENDING_FLOOR) {
    trendStatus = "currently-trending";
  } else if (combinedScore >= ABOUT_TO_TREND_FLOOR) {
    trendStatus = "about-to-trend";
  } else if (publishedAt) {
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours >= 0 && ageHours <= FRESHNESS_WINDOW_HOURS) {
      trendStatus = "about-to-trend";
    }
  }

  return { combinedScore, trendStatus, googleSignal, youtubeSignal };
}

async function computeGoogleSignal(title: string): Promise<number> {
  if (!tavilyProvider.isConfigured()) return 0;
  try {
    const results = await tavilyProvider.search(title, 10, { topic: "news", days: RECENCY_WINDOW_DAYS });
    const distinctSources = new Set(
      results
        .map((r) => {
          try {
            return new URL(r.url).hostname;
          } catch {
            return r.url;
          }
        })
        .filter(Boolean)
    ).size;
    return Math.min(100, distinctSources * 13);
  } catch {
    return 0;
  }
}

async function computeYoutubeSignal(title: string): Promise<number> {
  if (!youtubeProvider.isConfigured()) return 0;
  try {
    const videos = await youtubeProvider.searchCaseVideos(title, 20);
    const now = Date.now();
    const recentVideos = videos.filter((v) => {
      const ageDays = (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays <= RECENCY_WINDOW_DAYS;
    });
    if (recentVideos.length === 0) return 0;

    const totalViews = recentVideos.reduce((sum, v) => sum + v.viewCount, 0);
    const viewsScore = Math.min(60, Math.log10(totalViews + 1) * 15);
    const countScore = Math.min(40, recentVideos.length * 8);
    return Math.round(viewsScore + countScore);
  } catch {
    return 0;
  }
}