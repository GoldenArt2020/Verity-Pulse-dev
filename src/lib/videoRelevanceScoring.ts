import type { YouTubeVideoDetail } from "@/providers/youtube/types";

export interface RelevanceContext {
  caseName: string;
  victimNames: string[];
  suspectNames: string[];
  locations: string[];
}

export interface ScoredVideo {
  video: YouTubeVideoDetail;
  matchedQueries: string[];
  relevanceScore: number; // 0-100
}

const RELEVANCE_THRESHOLD = 55;

function containsPhrase(haystack: string, phrase: string): boolean {
  if (!phrase.trim()) return false;
  return haystack.toLowerCase().includes(phrase.toLowerCase());
}

/** Simple bag-of-words Jaccard similarity — good enough to flag likely
 * duplicate/near-duplicate uploads (e.g. the same clip re-uploaded by
 * multiple aggregator channels) without needing an AI call. */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const DUPLICATE_SIMILARITY_THRESHOLD = 0.75;

/**
 * Scores each discovered video for how relevant it actually is to the
 * case, rather than trusting raw search-result order. Factors: case name
 * / victim / suspect / location presence in title (weighted heaviest —
 * title matches are the strongest relevance signal) and description,
 * how many distinct search queries surfaced it (a video returned by
 * multiple angled queries is more likely to be genuinely about this
 * case, not a tangential mention), and recency as a small tiebreaker.
 */
export function scoreVideoRelevance(
  candidates: Map<string, { video: YouTubeVideoDetail; matchedQueries: Set<string> }>,
  ctx: RelevanceContext
): ScoredVideo[] {
  const scored: ScoredVideo[] = [];

  for (const { video, matchedQueries } of candidates.values()) {
    let score = 0;

    if (containsPhrase(video.title, ctx.caseName)) score += 30;
    else if (containsPhrase(video.description, ctx.caseName)) score += 12;

    for (const name of ctx.victimNames) {
      if (containsPhrase(video.title, name)) score += 20;
      else if (containsPhrase(video.description, name)) score += 8;
    }
    for (const name of ctx.suspectNames) {
      if (containsPhrase(video.title, name)) score += 20;
      else if (containsPhrase(video.description, name)) score += 8;
    }
    for (const loc of ctx.locations) {
      if (containsPhrase(video.title, loc)) score += 8;
      else if (containsPhrase(video.description, loc)) score += 3;
    }

    // Multi-query corroboration: found via more than one angled search
    // suggests it's genuinely about the case, not a coincidental keyword hit.
    score += Math.min(15, (matchedQueries.size - 1) * 6);

    // Mild recency tiebreaker — a fresh upload on an actively developing
    // case is marginally more valuable than a year-old one, but this
    // should never dominate over actual content-relevance signals above.
    const ageDays = (Date.now() - new Date(video.publishedAt).getTime()) / 86_400_000;
    if (ageDays < 14) score += 5;
    else if (ageDays < 90) score += 2;

    scored.push({ video, matchedQueries: Array.from(matchedQueries), relevanceScore: Math.min(100, score) });
  }

  // Duplicate/near-duplicate detection: among videos above the
  // threshold, flag ones whose titles are near-identical to a
  // higher-scored video already kept — likely the same underlying
  // report re-uploaded by another channel.
  const eligible = scored
    .filter((s) => s.relevanceScore >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const kept: ScoredVideo[] = [];
  for (const candidate of eligible) {
    const isDuplicate = kept.some(
      (k) => titleSimilarity(k.video.title, candidate.video.title) >= DUPLICATE_SIMILARITY_THRESHOLD
    );
    if (!isDuplicate) kept.push(candidate);
  }

  return kept;
}

export { RELEVANCE_THRESHOLD };