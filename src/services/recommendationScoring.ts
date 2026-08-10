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
  // Case Virality Score — computed by Groq using the 9-factor weighted
  // viral-true-crime rubric (mystery, emotional victim story, twist,
  // recent development, suspect/betrayal angle, evidence, public debate,
  // search interest, thumbnail potential). Distinct from audienceInterest:
  // this measures whether the STORY itself is inherently shareable/
  // bingeable, independent of whether it fits this channel.
  viralityScore: number; // 0-100
  viralityReason: string; // short "why" explanation, e.g. "New court development + relatable victim + conflicting timeline"
  bestAngle: string; // suggested storytelling angle/hook for the video
  thumbnailConcept: string; // short thumbnail concept description
  openingHook: string; // suggested opening line/hook for the script
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

/**
 * Compares a candidate case's victim demographic (as identified from real
 * search coverage of that case — never guessed) against this channel's own
 * DEMONSTRATED pattern (derived from that channel's own past video titles
 * in creatorDNA.ts, not an assumption imposed from outside). This is what
 * was previously computed but silently unused — the audience DNA block
 * showed this pattern to the model as context only, with nothing actually
 * scoring against it, so recommendations regularly crossed a channel's own
 * established audience pattern.
 *
 * Deliberately NOT a hard filter: stays neutral (50) whenever either side
 * lacks a clear signal, and a mismatch lowers rather than zeroes a
 * candidate out, since this is one input among several, not an
 * absolute gate.
 */
function demographicMatchScore(
  candidateEthnicity: string | null,
  channelPattern: string | null
): { score: number; matched: boolean } {
  if (!candidateEthnicity || !channelPattern) {
    return { score: 50, matched: false }; // no established pattern on one/both sides — stay neutral
  }
  const normalize = (s: string) => s.trim().toLowerCase();
  const isMatch = normalize(candidateEthnicity) === normalize(channelPattern);
  return { score: isMatch ? 100 : 35, matched: isMatch };
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
 * Scores one candidate using VerityPulse's 9-factor weighted formula:
 * Creator DNA Match 21.25% / Audience Interest 17% / Search Opportunity
 * 12.75% / Competition 8.5% / Untapped Angles 8.5% / Regional Match 8.5%
 * / News Momentum 4.25% / Historical Performance 4.25% / Virality 15%.
 *
 * Creator DNA Match is a BLEND: 50% Groq's holistic judgment + 25% a
 * deterministic case-type tag-overlap check + 25% a deterministic victim
 * demographic-pattern check, both computed here in code against the
 * channel's own proven history — so audience fit is grounded in real
 * data, not left entirely to the model's discretion. Regional Match
 * and Historical Performance are fully deterministic. Audience Interest,
 * Search Opportunity, Untapped Angles, News Momentum, and Virality remain
 * Groq's qualitative judgment (Virality is computed via an explicit
 * weighted rubric in the prompt — see buildPersonalizedPrompt/buildTrendPrompt
 * in recommendations.ts — rather than left to unguided discretion).
 */
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