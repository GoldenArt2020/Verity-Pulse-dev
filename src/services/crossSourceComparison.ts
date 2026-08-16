import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { jaccardSimilarity } from "@/lib/textSimilarity";
import { classifyVideoSourceTier, type ReliabilityTier } from "@/lib/sourceReliabilityTiers";
import type { SourceCategory } from "@/lib/videoCategorization";

const CONTENT_DUPLICATE_THRESHOLD = 0.6;

interface SourceForComparison {
  id: string;
  video_title: string;
  channel_name: string;
  source_category: SourceCategory;
  cleaned_transcript: string;
  claims: { text: string }[];
  tier: ReliabilityTier;
  duplicateGroupId: string; // the source's own id, or the id of the source it's grouped under
}

/**
 * Groups sources whose transcripts are substantially similar (spec item
 * 12 — three channels repeating the same underlying wire report should
 * not read as three independent confirmations). Pure text-similarity,
 * no AI call — this needs to be deterministic and cheap since it runs
 * over every pair of sources in the case.
 */
function groupDuplicateContent(sources: { id: string; cleaned_transcript: string }[]): Map<string, string> {
  const groupOf = new Map<string, string>(); // sourceId -> groupId (an existing sourceId)

  for (let i = 0; i < sources.length; i++) {
    if (groupOf.has(sources[i].id)) continue;
    groupOf.set(sources[i].id, sources[i].id);
    for (let j = i + 1; j < sources.length; j++) {
      if (groupOf.has(sources[j].id)) continue;
      const sim = jaccardSimilarity(sources[i].cleaned_transcript, sources[j].cleaned_transcript);
      if (sim >= CONTENT_DUPLICATE_THRESHOLD) {
        groupOf.set(sources[j].id, sources[i].id);
      }
    }
  }
  return groupOf;
}

interface ComparedClaim {
  claimSummary: string;
  status: "CONFIRMED" | "CONFLICTING" | "UNVERIFIED" | "SINGLE_SOURCE";
  citations: { sourceId: string; sourceTitle: string; tier: ReliabilityTier; statedValue: string }[];
}

function buildComparisonPrompt(caseName: string, sources: SourceForComparison[]): string {
  const distinctGroupCount = new Set(sources.map((s) => s.duplicateGroupId)).size;

  const sourceBlocks = sources
    .map(
      (s, i) =>
        `SOURCE ${i + 1} [id: ${s.id}] — "${s.video_title}" (${s.channel_name}, tier ${s.tier}${
          s.duplicateGroupId !== s.id ? `, DUPLICATE CONTENT of source group ${s.duplicateGroupId}` : ""
        }):\n${s.claims.map((c) => `- ${c.text}`).join("\n") || "(no claims extracted)"}`
    )
    .join("\n\n");

  return `You are a fact-checking analyst cross-referencing factual claims about the case "${caseName}" across ${sources.length} video sources (${distinctGroupCount} distinct underlying sources once duplicate content is accounted for).

${sourceBlocks}

Identify claims that multiple sources address (the same underlying fact, even if worded differently or with slightly different specifics — e.g. different exact times for the same event). For each such claim, classify:
- CONFIRMED: multiple DISTINCT (non-duplicate-content) sources state the same value, OR a tier-1/tier-2 source states it clearly
- CONFLICTING: distinct sources state materially different values for the same fact
- UNVERIFIED: only low-tier (4-5) sources address it, with no tier-1/2 corroboration, even if several low-tier sources repeat it
- SINGLE_SOURCE: only one distinct source addresses it at all

CRITICAL: sources flagged as duplicate content of another source's group must NEVER count as independent corroboration of each other — treat them as one source for confirmation purposes. Do not elevate a claim to CONFIRMED just because many tier-4/5 sources repeat it; that pattern should be UNVERIFIED unless a tier-1/2 source also states it.

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "claims": [
    {
      "claimSummary": string (the fact being compared, stated neutrally, e.g. "Time police received the emergency call"),
      "status": "CONFIRMED" | "CONFLICTING" | "UNVERIFIED" | "SINGLE_SOURCE",
      "citations": [ { "sourceId": string (must be one of the [id: ...] values above), "statedValue": string (what that specific source said) } ]
    }
  ]
}

Only include claims genuinely addressed by 1+ sources above — never invent a claim. Return ONLY the JSON object.`;
}

function parseComparisonResponse(raw: string): { claimSummary: string; status: string; citations: { sourceId: string; statedValue: string }[] }[] {
  const cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    return parsed.claims ?? [];
  } catch {
    return [];
  }
}

/**
 * Runs duplicate-content grouping, then a single Groq call to cluster
 * and classify claims across every extracted source for the case, and
 * saves the result to case_claim_comparisons (replacing any previous
 * run — this is meant to be re-run as new sources/transcripts come in,
 * not accumulated).
 */
export async function runCrossSourceComparison(caseId: string, caseName: string): Promise<number> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("video_sources")
    .select(
      "id, video_title, channel_name, source_category, video_transcripts(cleaned_transcript), video_source_extractions(claims)"
    )
    .eq("case_id", caseId)
    .eq("transcript_status", "available");

  const sources: SourceForComparison[] = (rows ?? [])
    .filter((r: any) => r.video_transcripts?.cleaned_transcript && r.video_source_extractions?.claims?.length > 0)
    .map((r: any) => ({
      id: r.id,
      video_title: r.video_title,
      channel_name: r.channel_name,
      source_category: r.source_category,
      cleaned_transcript: r.video_transcripts.cleaned_transcript,
      claims: r.video_source_extractions.claims,
      tier: classifyVideoSourceTier(r.source_category, r.channel_name),
      duplicateGroupId: r.id,
    }));

  if (sources.length === 0) return 0;

  const groupOf = groupDuplicateContent(sources);
  for (const s of sources) s.duplicateGroupId = groupOf.get(s.id) ?? s.id;

  // Persist the content-duplicate grouping onto video_sources too, so the
  // UI/other consumers can see it without re-running comparison.
  await Promise.all(
    sources
      .filter((s) => s.duplicateGroupId !== s.id)
      .map((s) => supabase.from("video_sources").update({ content_duplicate_of: s.duplicateGroupId }).eq("id", s.id))
  );

  const raw = await groqProvider.generateText(buildComparisonPrompt(caseName, sources), {
    temperature: 0.2,
    maxTokens: 3000,
  });
  const claims = parseComparisonResponse(raw);

  if (claims.length === 0) return 0;

  const titleById = new Map(sources.map((s) => [s.id, s.video_title]));
  const tierById = new Map(sources.map((s) => [s.id, s.tier]));

  const rowsToInsert = claims
    .filter((c) => ["CONFIRMED", "CONFLICTING", "UNVERIFIED", "SINGLE_SOURCE"].includes(c.status))
    .map((c) => ({
      case_id: caseId,
      claim_summary: c.claimSummary,
      status: c.status,
      citations: c.citations
        .filter((cit) => titleById.has(cit.sourceId))
        .map((cit) => ({
          sourceId: cit.sourceId,
          sourceTitle: titleById.get(cit.sourceId),
          tier: tierById.get(cit.sourceId),
          statedValue: cit.statedValue,
        })),
    }));

  // Replace previous run rather than accumulate stale comparisons.
  await supabase.from("case_claim_comparisons").delete().eq("case_id", caseId);
  const { error } = await supabase.from("case_claim_comparisons").insert(rowsToInsert);
  if (error) throw new Error(`Failed to save claim comparisons: ${error.message}`);

  return rowsToInsert.length;
}