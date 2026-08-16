import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getResearchSummary } from "@/services/researchSummary";
import type { ChannelDNA } from "@/services/creatorDNA";

function db() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function getCase(caseName: string) {
  const supabase = db();
  const { data, error } = await supabase
    .from("cases")
    .select("id, name, country, category, summary, opportunity_score, competition_score, solved_status")
    .ilike("name", `%${caseName}%`)
    .limit(5);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Metadata only, deliberately — see get_source_transcript for actual
 * transcript text, fetched one at a time so Claude never has to pull
 * every full transcript into context just to see what's available. */
export async function getCaseSources(caseId: string) {
  const supabase = db();
  const { data, error } = await supabase
    .from("video_sources")
    .select(
      "id, video_title, channel_name, publication_date, source_category, relevance_score, transcript_status, content_duplicate_of"
    )
    .eq("case_id", caseId)
    .order("relevance_score", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSourceTranscript(sourceId: string) {
  const supabase = db();
  const { data, error } = await supabase
    .from("video_transcripts")
    .select("cleaned_transcript, retrieved_via, created_at")
    .eq("source_id", sourceId)
    .single();
  if (error || !data) throw new Error("Transcript not found or not available for this source");
  return data;
}

export async function getCaseTimeline(caseId: string) {
  const supabase = db();
  const { data } = await supabase
    .from("video_source_extractions")
    .select("dates, video_sources!inner(case_id, video_title)")
    .eq("video_sources.case_id", caseId);

  const events = (data ?? []).flatMap((row: any) =>
    (row.dates ?? []).map((d: { date: string; event: string }) => ({
      date: d.date,
      event: d.event,
      source: row.video_sources.video_title,
    }))
  );

  // Best-effort chronological sort — dates come from AI extraction as
  // free-text, not guaranteed ISO format, so this can't be perfectly
  // reliable; it's a reasonable ordering, not an authoritative one.
  events.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return events;
}

/** "Evidence" here means the structured case-facts dossier from
 * caseResearch.ts (people, timeline, charges, locations, unresolved
 * questions) plus notable quotations extracted from video sources —
 * the closest existing concepts to spec item 10's "evidence". */
export async function getCaseEvidence(caseId: string) {
  const supabase = db();
  const [{ data: caseRow }, { data: extractions }] = await Promise.all([
    supabase.from("cases").select("case_facts").eq("id", caseId).single(),
    supabase
      .from("video_source_extractions")
      .select("quotations, video_sources!inner(case_id, video_title)")
      .eq("video_sources.case_id", caseId),
  ]);

  const quotations = (extractions ?? []).flatMap((row: any) =>
    (row.quotations ?? []).map((q: { text: string; speaker: string | null }) => ({
      ...q,
      source: row.video_sources.video_title,
    }))
  );

  return { caseFacts: caseRow?.case_facts ?? null, quotations };
}

export async function getResearchSummaryTool(caseId: string) {
  return getResearchSummary(caseId);
}

export async function getConflictingClaims(caseId: string) {
  const supabase = db();
  const { data, error } = await supabase
    .from("case_claim_comparisons")
    .select("claim_summary, citations")
    .eq("case_id", caseId)
    .eq("status", "CONFLICTING");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProductionBible(userId: string): Promise<ChannelDNA | null> {
  const supabase = db();
  const { data: activeRow } = await supabase
    .from("active_channel")
    .select("channel_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!activeRow?.channel_id) return null;

  const { data: channelRow } = await supabase
    .from("channels")
    .select("channel_dna")
    .eq("id", activeRow.channel_id)
    .maybeSingle();
  return (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
}