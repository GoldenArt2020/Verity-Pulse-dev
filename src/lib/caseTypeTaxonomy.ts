/**
 * Canonical case-type taxonomy shared across Creator DNA analysis and
 * case recommendation scoring.
 *
 * This is the axis VerityPulse uses to match cases to a channel's proven
 * audience — case TYPE, not victim race/ethnicity. How a crime happened
 * is objective and documented; it also travels well across markets in a
 * way a demographic label doesn't. UK true-crime content skews toward
 * gang-related, drug-related, and organized-crime cases where US content
 * skews more toward individual/domestic and police-involved cases — a
 * real, useful editorial distinction that doesn't require classifying
 * anyone by race.
 *
 * Both channel audience profiling (creatorDNA.ts) and candidate case
 * tagging (recommendations.ts) must draw tags from this exact list, so
 * overlap-matching in recommendationScoring.ts is reliable. Free-text tags
 * that don't match on wording/casing can't be compared against each other.
 */
export const CASE_TYPE_TAGS = [
  "missing-person",
  "police-involved-shooting",
  "police-misconduct",
  "institutional-failure",
  "domestic-violence",
  "gang-related",
  "drug-related",
  "organized-crime",
  "serial-crime",
  "cold-case",
  "wrongful-conviction",
  "child-victim",
  "cult-related",
  "white-collar-crime",
  "mass-casualty",
  "kidnapping",
  "human-trafficking",
  "unsolved-mystery",
] as const;

export type CaseTypeTag = (typeof CASE_TYPE_TAGS)[number];

export const CASE_TYPE_TAG_LIST_TEXT = CASE_TYPE_TAGS.join(", ");

export function normalizeCaseTypeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}