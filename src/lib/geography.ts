import type { ChannelDNA } from "@/services/creatorDNA";

/**
 * Canonical country normalization + hard geographic eligibility for the
 * recommendation engine. Country must never be just another scoring
 * signal — a case outside the channel's covered countries is INELIGIBLE
 * and must be removed from the candidate pool before scoring runs, not
 * merely down-weighted afterward.
 */

const COUNTRY_ALIASES: Record<string, string> = {
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  "northern ireland": "United Kingdom",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  "united kingdom": "United Kingdom",
  us: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  usa: "United States",
  "united states of america": "United States",
  "united states": "United States",
  america: "United States",
  canada: "Canada",
  australia: "Australia",
  ireland: "Ireland",
  "republic of ireland": "Ireland",
  "new zealand": "New Zealand",
  "south africa": "South Africa",
};

/** Normalizes free-text country/region names (Groq output, case records,
 * channel DNA) to one canonical label — "England", "UK", "Great Britain"
 * all collapse to "United Kingdom", etc. Falls back to a trimmed version
 * of the input for anything not in the alias table. */
export function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (key.length === 0) return null;
  return COUNTRY_ALIASES[key] ?? value.trim();
}

export interface ChannelGeographicProfile {
  /** Primary covered country, when the channel clearly specializes in
   * one (>=80% of analyzed content). Null for multi-country or
   * not-yet-established channels. */
  primaryCountry: string | null;
  /** Additional eligible countries — for multi-country channels, or a
   * secondary country crossing the minor-coverage threshold. */
  secondaryCountries: string[];
  /** True only when there's no reliable geographic signal at all (brand
   * new channel, no DNA yet) — in that case every country is eligible
   * rather than guessing one, per spec item 7. */
  isUnrestricted: boolean;
}

const SECONDARY_COUNTRY_THRESHOLD = 15; // % of channel content before a non-primary country counts as "also covered"

/** Derives the channel's geographic eligibility profile from Creator DNA.
 * `dna.regionDistribution` is built in creatorDNA.ts from the channel's
 * own video titles/subjects — never from user location, IP, or account
 * settings. */
export function resolveChannelGeographicProfile(dna: ChannelDNA | null | undefined): ChannelGeographicProfile {
  const regionDist = dna?.regionDistribution;
  const distribution = regionDist?.distribution ?? {};

  if (Object.keys(distribution).length === 0) {
    return { primaryCountry: null, secondaryCountries: [], isUnrestricted: true };
  }

  if (regionDist?.primaryRegion) {
    const secondary = Object.entries(distribution)
      .filter(
        ([country, pct]) =>
          normalizeCountry(country) !== normalizeCountry(regionDist.primaryRegion) &&
          pct >= SECONDARY_COUNTRY_THRESHOLD
      )
      .map(([country]) => country);
    return { primaryCountry: regionDist.primaryRegion, secondaryCountries: secondary, isUnrestricted: false };
  }

  // Multi-region channel: every country crossing the threshold is
  // eligible. None is treated as "primary" for filtering — scoring still
  // nuances between them (see recommendationScoring.ts's regionalMatchScore).
  const covered = Object.entries(distribution)
    .filter(([, pct]) => pct >= SECONDARY_COUNTRY_THRESHOLD)
    .map(([country]) => country);

  if (covered.length === 0) {
    return { primaryCountry: null, secondaryCountries: [], isUnrestricted: true };
  }
  return { primaryCountry: null, secondaryCountries: covered, isUnrestricted: false };
}

/** The hard gate. A candidate/case is eligible only if its country
 * matches the channel's primary or secondary covered countries. An
 * unrestricted channel (no established focus) accepts everything. A
 * restricted channel rejects candidates with an unknown country too —
 * "unknown" should never be assumed compatible with a hard filter. */
export function isGeographicallyEligible(
  candidateCountry: string | null | undefined,
  profile: ChannelGeographicProfile
): boolean {
  if (profile.isUnrestricted) return true;

  const normalizedCandidate = normalizeCountry(candidateCountry);
  if (!normalizedCandidate) return false;

  const covered = [profile.primaryCountry, ...profile.secondaryCountries]
    .map(normalizeCountry)
    .filter((c): c is string => c !== null);

  return covered.includes(normalizedCandidate);
}

/** Short human-readable line describing the channel's geographic
 * constraint, injected into recommendation prompts so the model is
 * steered toward the right countries up front — this doesn't replace
 * the hard filter below, it just reduces how many candidates get
 * generated only to be discarded. */
export function describeGeographicConstraint(profile: ChannelGeographicProfile): string {
  if (profile.isUnrestricted) {
    return "This channel has no established geographic focus yet — cases from any country are acceptable.";
  }
  const countries = [profile.primaryCountry, ...profile.secondaryCountries].filter(Boolean);
  if (profile.primaryCountry) {
    return `This channel exclusively covers cases from: ${countries.join(", ")} (primary focus: ${profile.primaryCountry}). Do NOT propose cases from any other country.`;
  }
  return `This channel exclusively covers cases from: ${countries.join(", ")}. Do NOT propose cases from any other country.`;
}