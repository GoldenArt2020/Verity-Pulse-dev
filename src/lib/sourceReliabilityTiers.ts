import type { SourceCategory } from "@/lib/videoCategorization";

export type ReliabilityTier = 1 | 2 | 3 | 4 | 5;

export const TIER_LABELS: Record<ReliabilityTier, string> = {
  1: "Official / Government",
  2: "Established News",
  3: "Documentary / Specialist",
  4: "Commentary / Opinion",
  5: "Unverified",
};

const CATEGORY_TIER: Record<SourceCategory, ReliabilityTier> = {
  COURT: 1,
  POLICE: 1,
  PRESS_CONFERENCE: 1,
  NEWS: 2,
  INTERVIEW: 2,
  DOCUMENTARY: 3,
  ANALYSIS: 3,
  ARCHIVE: 3,
  COMMENTARY: 4,
  PODCAST: 4,
  OTHER: 5,
};

// Channels whose content should read as official/primary-source
// regardless of how the video itself gets auto-categorized — extend this
// list as specific official channels come up in practice.
const OFFICIAL_CHANNEL_MARKERS = ["police department", "sheriff's office", "district attorney", "county court", "official channel"];

/** Deterministic, not AI-scored — reliability tier should be an
 * inspectable, explainable rule, not something that can silently drift
 * between runs. See spec's source-hierarchy requirement: a claim's tier
 * must never be inflated just because many low-tier sources repeat it. */
export function classifyVideoSourceTier(category: SourceCategory, channelName: string): ReliabilityTier {
  const c = channelName.toLowerCase();
  if (OFFICIAL_CHANNEL_MARKERS.some((m) => c.includes(m))) return 1;
  return CATEGORY_TIER[category] ?? 5;
}