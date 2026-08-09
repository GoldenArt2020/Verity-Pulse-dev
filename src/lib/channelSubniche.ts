import type { ChannelDNA } from "@/services/creatorDNA";
import { normalizeCaseTypeTag } from "@/lib/caseTypeTaxonomy";

/**
 * A channel's "subniche" for recommendation-dedup purposes: its single
 * most-proven case type, derived from its own video history (Creator DNA),
 * not a manually-set field. Channels with no DNA yet, or no case-type
 * signal, fall into a shared "general" bucket — so they still get
 * zero-tolerance duplicate protection against each other rather than none.
 */
export function deriveChannelSubniche(dna: ChannelDNA | null | undefined): string {
  const top = dna?.audienceDNA?.caseTypePreferences?.[0];
  return top ? normalizeCaseTypeTag(top) : "general";
}