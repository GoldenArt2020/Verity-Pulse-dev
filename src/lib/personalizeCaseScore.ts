import type { ChannelDNA } from "@/services/creatorDNA";

export interface PersonalizeCaseScoreInput {
  opportunityScore: number | null;
  competitionScore: number | null;
  coverageScore: number | null;
  caseTypeTags: string[];
  country: string | null;
}

export interface PersonalizedCaseScores {
  opportunityScore: number;
  competitionScore: number;
  coverageScore: number | null;
  isPersonalized: boolean;
}

/**
 * Blends a case's raw, market-wide scores with how well it fits the
 * currently connected channel specifically.
 *
 * - Opportunity Score: the case's own strength, weighted with how well its
 *   case-type tags match the channel's ranked case-type preferences and how
 *   well its country matches the channel's region distribution. The raw
 *   score still anchors the result so a globally weak case can't be
 *   inflated purely by a good channel match.
 * - YouTube Coverage: market-wide fact, passed through unchanged — it
 *   doesn't vary per channel.
 * - Competition Score: softened slightly when the case type sits outside
 *   the channel's proven strengths, since existing coverage there matters
 *   less to this specific channel's audience.
 *
 * Falls back to the raw scores, unmodified, when no Channel DNA is
 * available yet (no channel connected, or DNA still building).
 */
export function personalizeCaseScore(
  input: PersonalizeCaseScoreInput,
  dna: ChannelDNA | null
): PersonalizedCaseScores {
  const rawOpportunity = input.opportunityScore ?? 0;
  const rawCompetition = input.competitionScore ?? 0;

  if (!dna) {
    return {
      opportunityScore: Math.round(rawOpportunity),
      competitionScore: Math.round(rawCompetition),
      coverageScore: input.coverageScore,
      isPersonalized: false,
    };
  }

  // Case-type fit: where this case's tags land in the channel's ranked
  // case-type preferences. Top preference -> strong fit, no overlap -> weak fit.
  const prefs = dna.audienceDNA.caseTypePreferences ?? [];
  let caseTypeFit = 50; // neutral default when there isn't enough signal either way
  if (prefs.length > 0 && input.caseTypeTags.length > 0) {
    const matchedRanks = input.caseTypeTags
      .map((tag) => prefs.findIndex((p) => p.toLowerCase() === tag.toLowerCase()))
      .filter((idx) => idx !== -1);
    if (matchedRanks.length > 0) {
      const bestRank = Math.min(...matchedRanks);
      const spread = Math.max(prefs.length - 1, 1);
      caseTypeFit = Math.round(Math.max(20, 100 - (bestRank / spread) * 80));
    } else {
      caseTypeFit = 30; // both have tags, but none overlap — likely a weaker fit
    }
  }

  // Regional fit, mirroring the same logic used for recommendation scoring.
  // dna is guaranteed non-null here, but regionDistribution itself can still
  // be missing on channel_dna rows saved before this field existed in the
  // schema — destructuring it directly throws an uncaught TypeError that
  // crashes the whole page outside any React error boundary (this is what
  // was producing the "This page couldn't load" browser-level crash on
  // Angle Builder). Fall back to neutral/empty values instead of throwing.
  let regionFit = 50;
  if (input.country) {
    const { primaryRegion, isMultiRegion, distribution } = dna.regionDistribution ?? {
      primaryRegion: null,
      isMultiRegion: false,
      distribution: {},
    };
    if (primaryRegion) {
      regionFit = input.country.toLowerCase() === primaryRegion.toLowerCase() ? 100 : 20;
    } else if (isMultiRegion) {
      const pct = distribution[input.country] ?? 0;
      regionFit = Math.min(100, Math.max(30, pct * 2));
    }
  }

  const personalizationFactor = caseTypeFit * 0.65 + regionFit * 0.35;

  const opportunityScore = Math.round(rawOpportunity * 0.6 + personalizationFactor * 0.4);

  // If this case type sits outside the channel's strong suits, soften the
  // effective competition slightly — a crowded niche elsewhere matters less.
  const competitionAdjustment = caseTypeFit < 40 ? 0.85 : 1;
  const competitionScore = Math.round(rawCompetition * competitionAdjustment);

  return {
    opportunityScore: Math.max(0, Math.min(100, opportunityScore)),
    competitionScore: Math.max(0, Math.min(100, competitionScore)),
    coverageScore: input.coverageScore,
    isPersonalized: true,
  };
}