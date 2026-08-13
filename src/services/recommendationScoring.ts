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
  victimEthnicity: string | null; // identified from real search coverage, never guessed — see demographicMatchScore
  caseTypeTags: string[];
  lens: Lens | null;
  creatorDnaMatch: number; // 0-100, Groq's raw holistic judgment — blended with tag-overlap below
  audienceInterest: number; // 0-100, Groq: predicted general engagement for this case
  searchOpportunity: number; // 0-100, Groq: search/trend demand
  competitionScore: number; // 0-100, higher = less saturated
  untappedAnglesScore: number; // 0-100, Groq: quality/quantity of fresh angles available
  newsMomentum: number; // 0-100, Groq: breaking/developing status right now
  viralityScore: number; // 0-100
  viralityReason: string;
  bestAngle: string;
  thumbnailConcept: string;
  openingHook: string;
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
  viralityScore: number;
  finalScore: number;
  whyRecommended: string[];
  displayRegion: string | null;
  isRegionException: boolean;
}

const WEIGHTS = {
  creatorDna: 0.2125,
  audienceInterest: 0.17,
  searchOpportunity: 0.1275,
  competition: 0.085,
  untappedAngles: 0.085,
  regional: 0.085,
  newsMomentum: 0.0425,
  historicalPerformance: 0.0425,
  virality: 0.15,
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

function caseTypeOverlapScore(
  candidateTags: string[],
  preferences: string[]
): { score: number; matched: string[] } {
  if (candidateTags.length === 0 || preferences.length === 0) {
    return { score: 50, matched: [] };
  }
  const prefSet = new Set(preferences.map(normalizeCaseTypeTag));
  const matched = candidateTags.map(normalizeCaseTypeTag).filter((t) => prefSet.has(t));
  if (matched.length === 0) {
    return { score: 30, matched: [] };
  }
  const ratio = matched.length / candidateTags.length;
  return { score: Math.round(40 + ratio * 60), matched };
}

/**
 * Compares a candidate case's victim demographic (as identified from real
 * search coverage of that case — never guessed) against this channel's own
 * DEMONSTRATED pattern (derived from that channel's own past video titles
 * in creatorDNA.ts, not an assumption imposed from outside). Deliberately
 * NOT a hard filter: stays neutral (50) whenever either side lacks a clear
 * signal, and a mismatch lowers rather than zeroes a candidate out.
 */
function demographicMatchScore(
  candidateEthnicity: string | null,
  channelPattern: string | null
): { score: number; matched: boolean } {
  if (!candidateEthnicity || !channelPattern) {
    return { score: 50, matched: false };
  }
  const normalize = (s: string) => s.trim().toLowerCase();
  const isMatch = normalize(candidateEthnicity) === normalize(channelPattern);
  return { score: isMatch ? 100 : 35, matched: isMatch };
}

/**
 * HARD region lock: for any channel with an established single primary
 * region (detected from that channel's own video history when it was
 * connected — see regionDistribution in creatorDNA.ts), a candidate is
 * blocked unless its region is confidently identified AND matches exactly.
 * Generalized to whatever region the channel actually is — UK-only
 * channels get UK-only, US-only get US-only, Canada-only get
 * Canada-only, etc. — not hardcoded to any specific country.
 *
 * An UNDETERMINED candidate region is also blocked here, not passed
 * through neutrally — for a channel with a known single region, "we
 * couldn't confirm the country" is a reason to exclude, not a reason to
 * treat as a coin-flip match. Multi-region channels (no single primary
 * region) are unaffected.
 */
export function isBlockedByRegion(candidateRegion: string | null, dna: ChannelDNA): boolean {
  const primaryRegion = dna.regionDistribution?.primaryRegion ?? null;
  if (!primaryRegion) return false;
  if (!candidateRegion) return true;
  return candidateRegion.toLowerCase() !== primaryRegion.toLowerCase();
}

function regionalMatchScore(candidateRegion: string | null, dna: ChannelDNA): number {
  const primaryRegion = dna.regionDistribution?.primaryRegion ?? null;
  const isMultiRegion = dna.regionDistribution?.isMultiRegion ?? false;
  const distribution = dna.regionDistribution?.distribution ?? {};

  // isBlockedByRegion already removes any non-matching or undetermined
  // candidate before scoring ever runs for single-region channels, so any
  // candidate that reaches this function for such a channel is already a
  // confirmed match.
  if (primaryRegion) {
    return 100;
  }
  if (!candidateRegion) return 50;
  if (isMultiRegion) {
    const pct = distribution[candidateRegion] ?? 0;
    return Math.min(100, pct * 2);
  }
  return 50;
}

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

export function scoreCandidate(candidate: ScoredCandidate, dna: ChannelDNA): ScoreBreakdown {
  const historicalPerformance = lensHistoricalScore(candidate.lens, dna.lensPerformance);
  const regionalMatch = regionalMatchScore(candidate.region, dna);
  const { displayRegion, isRegionException } = resolveDisplayRegion(candidate.region, dna);

  const { score: caseTypeScore, matched: matchedCaseTypes } = caseTypeOverlapScore(
    candidate.caseTypeTags,
    dna.audienceDNA?.caseTypePreferences ?? []
  );

  const { score: demographicScore, matched: demographicMatched } = demographicMatchScore(
    candidate.victimEthnicity,
    dna.audienceDNA?.victimDemographicPreferences?.ethnicity ?? null
  );

  const creatorDnaMatch = Math.round(
    candidate.creatorDnaMatch * 0.5 + caseTypeScore * 0.25 + demographicScore * 0.25
  );

  const finalScore = Math.round(
    creatorDnaMatch * WEIGHTS.creatorDna +
      candidate.audienceInterest * WEIGHTS.audienceInterest +
      candidate.searchOpportunity * WEIGHTS.searchOpportunity +
      candidate.competitionScore * WEIGHTS.competition +
      candidate.untappedAnglesScore * WEIGHTS.untappedAngles +
      regionalMatch * WEIGHTS.regional +
      candidate.newsMomentum * WEIGHTS.newsMomentum +
      historicalPerformance * WEIGHTS.historicalPerformance +
      candidate.viralityScore * WEIGHTS.virality
  );

  const whyRecommended: string[] = [];
  if (candidate.viralityScore >= 85) {
    whyRecommended.push(`🔥 Extremely strong virality candidate (${candidate.viralityScore}/100) — ${candidate.viralityReason}`);
  } else if (candidate.viralityScore >= 70) {
    whyRecommended.push(`Strong story virality (${candidate.viralityScore}/100) — ${candidate.viralityReason}`);
  }
  if (matchedCaseTypes.length > 0) {
    whyRecommended.push(`Matches case types your audience already responds well to (${matchedCaseTypes.join(", ")}).`);
  }
  if (demographicMatched) {
    whyRecommended.push(`Matches the victim demographic pattern your channel's audience has proven to respond to.`);
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
    viralityScore: candidate.viralityScore,
    finalScore,
    whyRecommended,
    displayRegion,
    isRegionException,
  };
}