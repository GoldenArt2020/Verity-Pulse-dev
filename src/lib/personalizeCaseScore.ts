import type { ChannelDNA } from "@/services/creatorDNA";
import { normalizeCaseTypeTag } from "@/lib/caseTypeTaxonomy";

export interface PersonalizedCaseScore {
  opportunityScore: number; // blended, channel-aware
  baseOpportunityScore: number; // original case-level editorial score, unchanged
  competitionScore: number; // adjusted for this channel's niche fit
  coverageScore: number | null; // stays global — existing YouTube coverage is a market fact, not channel-specific
  caseTypeMatch: number; // 0-100, how well this case's type fits the channel's proven audience
  regionalMatch: number; // 0-100
  isPersonalized: boolean; // false if no Creator DNA yet — falls back to base scores
}

function caseTypeOverlapScore(caseTags: string[], preferences: string[]): number {
  if (caseTags.length === 0 || preferences.length === 0) return 50;
  const prefSet = new Set(preferences.map(normalizeCaseTypeTag));
  const matched = caseTags.map(normalizeCaseTypeTag).filter((t) => prefSet.has(t));
  if (matched.length === 0) return 30;
  const ratio = matched.length / caseTags.length;
  return Math.round(40 + ratio * 60);
}

function regionalMatchScore(caseCountry: string | null, dna: ChannelDNA): number {
  const { primaryRegion, isMultiRegion, distribution } = dna.regionDistribution;
  if (!caseCountry) return 50;
  if (primaryRegion) {
    return caseCountry.toLowerCase() === primaryRegion.toLowerCase() ? 100 : 20;
  }
  if (isMultiRegion) {
    const pct = distribution[caseCountry] ?? 0;
    return Math.min(100, 40 + pct);
  }
  return 50;
}

/**
 * Adjusts a case's base (channel-agnostic) scores using the connected
 * channel's Creator DNA, so "Opportunity Score" and "Competition Score"
 * reflect how good a fit THIS case is for the channel that's actually
 * connected — not just a flat, global editorial estimate every channel
 * sees identically. Falls back to the unmodified base scores when no
 * Creator DNA is available yet (e.g. channel just connected, still
 * analyzing its history).
 */
export function personalizeCaseScore(
  caseInput: {
    opportunityScore: number | null;
    competitionScore: number | null;
    coverageScore: number | null;
    caseTypeTags: string[];
    country: string | null;
  },
  dna: ChannelDNA | null
): PersonalizedCaseScore {
  const baseOpportunity = caseInput.opportunityScore ?? 50;
  const baseCompetition = caseInput.competitionScore ?? 50;

  if (!dna) {
    return {
      opportunityScore: baseOpportunity,
      baseOpportunityScore: baseOpportunity,
      competitionScore: baseCompetition,
      coverageScore: caseInput.coverageScore,
      caseTypeMatch: 50,
      regionalMatch: 50,
      isPersonalized: false,
    };
  }

  const caseTypeMatch = caseTypeOverlapScore(caseInput.caseTypeTags, dna.audienceDNA?.caseTypePreferences ?? []);
  const regionalMatch = regionalMatchScore(caseInput.country, dna);

  // Opportunity blends the case's global editorial strength (60%) with how
  // well it fits THIS channel's proven audience — case-type overlap (25%)
  // and regional fit (15%). A case that scores well editorially but is a
  // poor fit for this specific audience shows a lower number here than a
  // generic, channel-agnostic view would give it.
  const opportunityScore = Math.round(baseOpportunity * 0.6 + caseTypeMatch * 0.25 + regionalMatch * 0.15);

  // Competition also shifts slightly: a case with heavy general coverage
  // but almost none in this channel's specific case-type niche is a better
  // real opportunity for this channel than the raw global number suggests.
  const nicheAdjustment = Math.round((caseTypeMatch - 50) * 0.2);
  const competitionScore = Math.max(0, Math.min(100, baseCompetition - nicheAdjustment));

  return {
    opportunityScore,
    baseOpportunityScore: baseOpportunity,
    competitionScore,
    coverageScore: caseInput.coverageScore,
    caseTypeMatch,
    regionalMatch,
    isPersonalized: true,
  };
}