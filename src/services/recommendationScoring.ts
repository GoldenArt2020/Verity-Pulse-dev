import type { ChannelDNA, LensPerformance } from "@/services/creatorDNA";
import { normalizeCaseTypeTag } from "@/lib/caseTypeTaxonomy";

const LENS_IDS = [
  "victim-centered",
  "investigative",
  "systemic-failure",
  "family-impact",
  "courtroom",
] as const;
type Lens = (typeof LENS_IDS)[number];

export interface ScoredCandidate {
  title: string;
  reason: string;
  region: string | null;
  caseTypeTags: string[];
  lens: Lens | null;
  creatorDnaMatch: number; // 0-100, Groq's raw holistic judgment — blended with tag-overlap below
  audienceInterest: number; // 0-100, Groq: predicted general engagement for this case
  searchOpportunity: number; // 0-100, Groq: search/trend demand
  competitionScore: number; // 0-100, higher = less saturated
  untappedAnglesScore: number; // 0-100, Groq: quality/quantity of fresh angles available
  newsMomentum: number; // 0-100, Groq: breaking/developing status right now
}

export interface ScoreBreakdown {
  creatorDnaMatch: number;
  audienceInterest: number;
  searchOpportunity: number;
  competition: number;
  untappedAngles: number;
  regionalMatch: number;
  newsMomentum: number;
  historicalPerformance: number;
  finalScore: number;
  whyRecommended: string[];
  displayRegion: string | null;
  isRegionException: boolean;
}

const WEIGHTS = {
  creatorDna: 0.25,
  audienceInterest: 0.2,
  searchOpportunity: 0.15,
  competition: 0.1,
  untappedAngles: 0.1,
  regional: 0.1,
  newsMomentum: 0.05,
  historicalPerformance: 0.05,
};

export const RECOMMENDATION_THRESHOLD = 60;

function lensHistoricalScore(lens: Lens | null, lensPerformance: LensPerformance[] | undefined | null): number {
  if (!lens || !lensPerformance) return 50;
  const match = lensPerformance.find((l) => l.lens === lens);
  if (!match || match.videoCount === 0) return 50;
  if (match.avgViewsRelativeToChannel === "above average") return 100;
  if (match.avgViewsRelativeToChannel === "below average") return 15;
  return 55;
}

/**
 * Deterministic case-type overlap between a candidate case and this
 * channel's proven case-type preferences (learned from its own video
 * history in creatorDNA.ts, not assigned). This is the mechanism that
 * differentiates, e.g., a channel whose audience responds to
 * gang-related/drug-related cases from one whose audience responds to
 * institutional-failure or missing-person cases — grounded in case type,
 * not demographic labeling of victims or channels.
 */
function caseTypeOverlapScore(
  candidateTags: string[],
  preferences: string[]
): { score: number; matched: string[] } {
  if (candidateTags.length === 0 || preferences.length === 0) {
    return { score: 50, matched: [] }; // insufficient data either side — stay neutral
  }
  const prefSet = new Set(preferences.map(normalizeCaseTypeTag));
  const matched = candidateTags.map(normalizeCaseTypeTag).filter((t) => prefSet.has(t));
  if (matched.length === 0) {
    return { score: 30, matched: [] };
  }
  const ratio = matched.length / candidateTags.length;
  return { score: Math.round(40 + ratio * 60), matched };
}

function regionalMatchScore(candidateRegion: string | null, dna: ChannelDNA): number {
  const primaryRegion = dna.regionDistribution?.primaryRegion ?? null;
  const isMultiRegion = dna.regionDistribution?.isMultiRegion ?? false;
  const distribution = dna.regionDistribution?.distribution ?? {};

  if (!candidateRegion) return 50;
  if (primaryRegion) {
    return candidateRegion.toLowerCase() === primaryRegion.toLowerCase() ? 100 : 5;
  }
  if (isMultiRegion) {
    const pct = distribution[candidateRegion] ?? 0;
    return Math.min(100, pct * 2);
  }
  return 50;
}

/**
 * Determines what region to DISPLAY on a recommendation card, distinct
 * from the score. Single-country channels always show their own primary
 * region for reassurance (since near-all recommendations genuinely are
 * in that region anyway); if a candidate slips through from outside that
 * region, its real region is shown instead, flagged as an exception.
 * Multi-region channels always show the candidate's actual region.
 */
function resolveDisplayRegion(
  candidateRegion: string | null,
  dna: ChannelDNA
): { displayRegion: string | null; isRegionException: boolean } {
  const primaryRegion = dna.regionDistribution?.primaryRegion ?? null;
  const isMultiRegion = dna.regionDistribution?.isMultiRegion ?? false;

  if (primaryRegion) {
    const isException = !!candidateRegion && candidateRegion.toLowerCase() !== primaryRegion.toLowerCase();
    return {
      displayRegion: isException ? candidateRegion : primaryRegion,
      isRegionException: isException,
    };
  }

  if (isMultiRegion) {
    return { displayRegion: candidateRegion, isRegionException: false };
  }

  return { displayRegion: candidateRegion, isRegionException: false };
}

/**
 * Scores one candidate using VerityPulse's 8-factor weighted formula:
 * Creator DNA Match 25% / Audience Interest 20% / Search Opportunity 15%
 * / Competition 10% / Untapped Angles 10% / Regional Match 10% /
 * News Momentum 5% / Historical Performance 5%.
 *
 * Creator DNA Match is now a BLEND: 60% Groq's holistic judgment + 40% a
 * deterministic case-type tag-overlap check computed here in code against
 * the channel's own proven history — so audience fit is grounded in real
 * tag data, not left entirely to the model's discretion. Regional Match
 * and Historical Performance are fully deterministic. Audience Interest,
 * Search Opportunity, Untapped Angles, and News Momentum remain Groq's
 * qualitative judgment.
 */
export function scoreCandidate(candidate: ScoredCandidate, dna: ChannelDNA): ScoreBreakdown {
  const historicalPerformance = lensHistoricalScore(candidate.lens, dna.lensPerformance);
  const regionalMatch = regionalMatchScore(candidate.region, dna);
  const { displayRegion, isRegionException } = resolveDisplayRegion(candidate.region, dna);

  const { score: caseTypeScore, matched: matchedCaseTypes } = caseTypeOverlapScore(
    candidate.caseTypeTags,
    dna.audienceDNA?.caseTypePreferences ?? []
  );

  const creatorDnaMatch = Math.round(candidate.creatorDnaMatch * 0.6 + caseTypeScore * 0.4);

  const finalScore = Math.round(
    creatorDnaMatch * WEIGHTS.creatorDna +
      candidate.audienceInterest * WEIGHTS.audienceInterest +
      candidate.searchOpportunity * WEIGHTS.searchOpportunity +
      candidate.competitionScore * WEIGHTS.competition +
      candidate.untappedAnglesScore * WEIGHTS.untappedAngles +
      regionalMatch * WEIGHTS.regional +
      candidate.newsMomentum * WEIGHTS.newsMomentum +
      historicalPerformance * WEIGHTS.historicalPerformance
  );

  const whyRecommended: string[] = [];
  if (matchedCaseTypes.length > 0) {
    whyRecommended.push(`Matches case types your audience already responds well to (${matchedCaseTypes.join(", ")}).`);
  }
  if (creatorDnaMatch >= 80) {
    whyRecommended.push(`${creatorDnaMatch}% match to your channel's proven content style.`);
  }
  if (historicalPerformance >= 80 && candidate.lens) {
    whyRecommended.push(`Matches your best-performing storytelling lens (${candidate.lens.replace("-", " ")}).`);
  }
  if (regionalMatch >= 80 && displayRegion) {
    whyRecommended.push(`Aligns with your channel's region (${displayRegion}).`);
  }
  if (candidate.untappedAnglesScore >= 70) {
    whyRecommended.push("Strong untapped storytelling angles available.");
  }
  if (candidate.competitionScore >= 70) {
    whyRecommended.push("Low existing YouTube competition relative to search demand.");
  }
  if (candidate.newsMomentum >= 70) {
    whyRecommended.push("Currently developing or receiving renewed attention.");
  }
  if (whyRecommended.length === 0) {
    whyRecommended.push(candidate.reason);
  }

  return {
    creatorDnaMatch,
    audienceInterest: candidate.audienceInterest,
    searchOpportunity: candidate.searchOpportunity,
    competition: candidate.competitionScore,
    untappedAngles: candidate.untappedAnglesScore,
    regionalMatch,
    newsMomentum: candidate.newsMomentum,
    historicalPerformance,
    finalScore,
    whyRecommended,
    displayRegion,
    isRegionException,
  };
}