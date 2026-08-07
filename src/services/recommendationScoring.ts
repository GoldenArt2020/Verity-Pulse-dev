import type { ChannelDNA, LensPerformance } from "@/services/creatorDNA";

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
  creatorDnaMatch: number; // 0-100, Groq: style/subject fit to this channel's proven content
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

function lensHistoricalScore(lens: Lens | null, lensPerformance: LensPerformance[]): number {
  if (!lens) return 50;
  const match = lensPerformance.find((l) => l.lens === lens);
  if (!match || match.videoCount === 0) return 50;
  if (match.avgViewsRelativeToChannel === "above average") return 100;
  if (match.avgViewsRelativeToChannel === "below average") return 15;
  return 55;
}

function regionalMatchScore(candidateRegion: string | null, dna: ChannelDNA): number {
  const { primaryRegion, isMultiRegion, distribution } = dna.regionDistribution;
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
  const { primaryRegion, isMultiRegion } = dna.regionDistribution;

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
 * Creator DNA, Audience Interest, Search Opportunity, Untapped Angles,
 * and News Momentum are Groq's qualitative judgment on the candidate.
 * Regional Match and Historical Performance are computed deterministically
 * here from real stored channel data, so those two dimensions are never
 * left to the model's discretion.
 */
export function scoreCandidate(candidate: ScoredCandidate, dna: ChannelDNA): ScoreBreakdown {
  const historicalPerformance = lensHistoricalScore(candidate.lens, dna.lensPerformance);
  const regionalMatch = regionalMatchScore(candidate.region, dna);
  const { displayRegion, isRegionException } = resolveDisplayRegion(candidate.region, dna);

  const finalScore = Math.round(
    candidate.creatorDnaMatch * WEIGHTS.creatorDna +
      candidate.audienceInterest * WEIGHTS.audienceInterest +
      candidate.searchOpportunity * WEIGHTS.searchOpportunity +
      candidate.competitionScore * WEIGHTS.competition +
      candidate.untappedAnglesScore * WEIGHTS.untappedAngles +
      regionalMatch * WEIGHTS.regional +
      candidate.newsMomentum * WEIGHTS.newsMomentum +
      historicalPerformance * WEIGHTS.historicalPerformance
  );

  const whyRecommended: string[] = [];
  if (candidate.creatorDnaMatch >= 80) {
    whyRecommended.push(`${candidate.creatorDnaMatch}% match to your channel's proven content style.`);
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
    creatorDnaMatch: candidate.creatorDnaMatch,
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