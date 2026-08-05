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
  audienceDnaMatch: number; // 0-100, Groq judgment
  storytellingMatch: number; // 0-100, Groq judgment
  competitionScore: number; // 0-100, higher = less saturated
  trendPotential: number; // 0-100
}

export interface ScoreBreakdown {
  audienceDnaMatch: number;
  historicalPerformanceMatch: number;
  storytellingMatch: number;
  geographicMatch: number;
  trendPotential: number;
  competitionScore: number;
  finalScore: number;
  whyRecommended: string[];
}

const WEIGHTS = {
  audienceDna: 0.4,
  historicalPerformance: 0.25,
  storytelling: 0.15,
  geographic: 0.1,
  trend: 0.05,
  competition: 0.05,
};

export const RECOMMENDATION_THRESHOLD = 80;

function lensHistoricalScore(lens: Lens | null, lensPerformance: LensPerformance[]): number {
  if (!lens) return 50; // no signal — neutral
  const match = lensPerformance.find((l) => l.lens === lens);
  if (!match || match.videoCount === 0) return 50; // no history in this lens — neutral, not penalized
  if (match.avgViewsRelativeToChannel === "above average") return 100;
  if (match.avgViewsRelativeToChannel === "below average") return 15;
  return 55;
}

function geographicScore(
  candidateRegion: string | null,
  dna: ChannelDNA
): number {
  const { primaryRegion, isMultiRegion, distribution } = dna.regionDistribution ?? {
    primaryRegion: null,
    isMultiRegion: false,
    distribution: {},
  };

  if (!candidateRegion) return 50; // unknown region — neutral, don't penalize missing data

  if (primaryRegion) {
    return candidateRegion.toLowerCase() === primaryRegion.toLowerCase() ? 100 : 5;
  }

  if (isMultiRegion) {
    const pct = distribution[candidateRegion] ?? 0;
    // Channel has demonstrated coverage of multiple regions — score by
    // how much of their history is actually in this candidate's region.
    return Math.min(100, pct * 2);
  }

  return 50; // no region data at all yet
}

/**
 * Scores one candidate against a channel's Creator DNA using the fixed
 * weighted formula (40% Audience DNA / 25% Historical Performance /
 * 15% Storytelling / 10% Geographic / 5% Trend / 5% Competition).
 * Audience DNA and Storytelling are Groq's qualitative judgment calls
 * (provided on the candidate); Historical Performance and Geographic
 * are computed deterministically here from real stored channel data,
 * so the weighting itself is never left to the model.
 */
export function scoreCandidate(candidate: ScoredCandidate, dna: ChannelDNA): ScoreBreakdown {
  const historicalPerformanceMatch = lensHistoricalScore(candidate.lens, dna.lensPerformance);
  const geographicMatch = geographicScore(candidate.region, dna);

  const finalScore = Math.round(
    candidate.audienceDnaMatch * WEIGHTS.audienceDna +
      historicalPerformanceMatch * WEIGHTS.historicalPerformance +
      candidate.storytellingMatch * WEIGHTS.storytelling +
      geographicMatch * WEIGHTS.geographic +
      candidate.trendPotential * WEIGHTS.trend +
      candidate.competitionScore * WEIGHTS.competition
  );

  const whyRecommended: string[] = [];
  if (candidate.audienceDnaMatch >= 80) {
    whyRecommended.push(`${candidate.audienceDnaMatch}% audience similarity to your channel's proven interests.`);
  }
  if (historicalPerformanceMatch >= 80 && candidate.lens) {
    whyRecommended.push(`Matches your best-performing storytelling lens (${candidate.lens.replace("-", " ")}).`);
  }
  if (geographicMatch >= 80 && candidate.region) {
    whyRecommended.push(`Aligns with your channel's primary region (${candidate.region}).`);
  }
  if (candidate.competitionScore >= 70) {
    whyRecommended.push("Low existing YouTube competition relative to search demand.");
  }
  if (candidate.trendPotential >= 70) {
    whyRecommended.push("Strong current or emerging trend signal.");
  }
  if (whyRecommended.length === 0) {
    whyRecommended.push(candidate.reason);
  }

  return {
    audienceDnaMatch: candidate.audienceDnaMatch,
    historicalPerformanceMatch,
    storytellingMatch: candidate.storytellingMatch,
    geographicMatch,
    trendPotential: candidate.trendPotential,
    competitionScore: candidate.competitionScore,
    finalScore,
    whyRecommended,
  };
}