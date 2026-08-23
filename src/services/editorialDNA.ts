export interface EditorialDNA {
  channelPurpose: string[]; // e.g. ["Missing Persons", "Cold Cases"] — chips + custom
  channelIdentity: string; // open text: "what should this channel be known for"

  coreContent: string[];
  secondaryContent: string[];
  excludedContent: string[];

  geographicFocus: string[]; // e.g. ["United Kingdom"], or ["Worldwide"]
  excludedGeographies: string[];

  caseAgePreference: string[]; // e.g. ["Last 5 years", "Historical cases"]
  caseStatusCore: string[];
  caseStatusExcluded: string[];

  editorialLens: string[]; // e.g. ["Investigative", "Timeline-focused"]
  idealEpisodeDescription: string;

  differentiator: string;

  titlePriorities: string[];
  thumbnailPriorities: string[];

  primaryGoal: string;

  editorialBoundaries: string[]; // selected + custom "never do" rules

  channelPromise: string; // "when someone watches, they should feel ___"
  channelMission: string; // "this channel exists to ___"

  completedAt: string;
}

export const CHANNEL_PURPOSE_OPTIONS = [
  "Missing Persons", "Disappearances", "Murder", "Unsolved Murder", "Cold Cases",
  "Solved Cases", "True Crime", "Organized Crime", "Gang Crime", "Serial Killers",
  "Historical Crime", "Recent Crime",
];

export const CASE_AGE_OPTIONS = [
  "Breaking / current cases", "Last 12 months", "Last 3 years", "Last 5 years",
  "Last 10 years", "Historical cases", "Any period",
];

export const CASE_STATUS_OPTIONS = [
  "Active investigations", "Missing persons", "Unsolved", "Cold cases", "Solved",
  "Cases with convictions", "Cases awaiting trial", "Cases with recent developments",
  "Victim found", "Victim still missing",
];

export const EDITORIAL_LENS_OPTIONS = [
  "Investigative", "Documentary", "Human-focused", "Timeline-focused", "Evidence-focused",
  "Mystery-focused", "Police-investigation-focused", "Court/evidence-focused",
  "Historical", "Breaking-news", "Explainer", "Analytical",
];

export const TITLE_PRIORITY_OPTIONS = [
  "Search", "Curiosity", "Mystery", "Emotion", "Investigation", "Breaking news", "Person/case name",
];

export const THUMBNAIL_PRIORITY_OPTIONS = [
  "Person", "Mystery", "Evidence", "Location", "Suspect", "Timeline", "Discovery", "Emotion",
];

export const GOAL_OPTIONS = [
  "Grow search traffic", "Grow suggested traffic", "Build loyal viewers", "Cover current cases",
  "Build authority", "Become an investigative brand", "Monetization", "Build a long-term media brand",
];

export const BOUNDARY_OPTIONS = [
  "Sensationalize victims", "Present speculation as fact", "Accuse uncharged people",
  "Use fake evidence", "Use misleading thumbnails", "Use misleading titles",
  "Use AI-generated fake events", "Exploit grieving families", "Encourage amateur investigation",
];

const GEOGRAPHY_OPTIONS = ["United States", "United Kingdom", "Canada", "Australia", "Ireland", "Worldwide"];
export { GEOGRAPHY_OPTIONS };

/** A conservative, safe-to-prefill starting point built from raw YouTube
 * channel data (title/description/topics) — NEVER auto-saved, only shown
 * to the creator as an editable suggestion they must confirm. Old/pivoted
 * channels must be free to reject every single field here. */
export function suggestEditorialDNA(
  channelTitle: string,
  channelDescription: string,
  preferredSubjects: string[]
): Partial<EditorialDNA> {
  const text = `${channelTitle} ${channelDescription}`.toLowerCase();
  const purpose: string[] = [];
  if (/missing|disappear/i.test(text)) purpose.push("Missing Persons");
  if (/murder/i.test(text)) purpose.push("Murder");
  if (/cold case/i.test(text)) purpose.push("Cold Cases");
  if (/unsolved/i.test(text)) purpose.push("Unsolved Murder");
  if (purpose.length === 0 && preferredSubjects.length > 0) purpose.push("True Crime");

  return {
    channelPurpose: purpose,
    coreContent: preferredSubjects.slice(0, 5),
  };
}