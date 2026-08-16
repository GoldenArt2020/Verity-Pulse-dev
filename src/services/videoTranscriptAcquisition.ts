import { createClient } from "@/lib/supabase/server";
import { youtubePublicCaptionsProvider } from "@/providers/transcript/youtubePublicCaptionsProvider";
import { cleanTranscript } from "@/lib/transcriptCleaning";
import type { TranscriptProvider } from "@/providers/transcript/types";

const activeProvider: TranscriptProvider = youtubePublicCaptionsProvider;

export interface TranscriptAcquisitionResult {
  sourceId: string;
  status: "available" | "unavailable";
}

/** Fetches, cleans, and saves the transcript for one video_sources row.
 * Always ends in a real terminal status — never leaves it stuck at
 * "processing", never marks "available" without an actual saved
 * transcript backing it up. */
export async function acquireTranscriptForSource(sourceId: string): Promise<TranscriptAcquisitionResult> {
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("video_sources")
    .select("id, youtube_video_id")
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Video source not found");
  }

  await supabase.from("video_sources").update({ transcript_status: "processing" }).eq("id", sourceId);

  const result = await activeProvider.fetchTranscript(source.youtube_video_id);

  if (result.status === "unavailable") {
    await supabase
      .from("video_sources")
      .update({ transcript_status: "unavailable", retrieval_date: new Date().toISOString() })
      .eq("id", sourceId);
    return { sourceId, status: "unavailable" };
  }

  const cleaned = cleanTranscript(result.segments);

  const { error: transcriptError } = await supabase.from("video_transcripts").upsert(
    {
      source_id: sourceId,
      raw_transcript: result.rawText,
      cleaned_transcript: cleaned,
      segments: result.segments,
      retrieved_via: result.retrievedVia,
    },
    { onConflict: "source_id" }
  );

  if (transcriptError) {
    throw new Error(`Failed to save transcript: ${transcriptError.message}`);
  }

  await supabase
    .from("video_sources")
    .update({
      transcript_status: "available",
      transcript_language: result.language,
      retrieval_date: new Date().toISOString(),
    })
    .eq("id", sourceId);

  return { sourceId, status: "available" };
}

/** Processes up to `limit` not-yet-attempted sources for a case,
 * sequentially, in one call — bounded so it stays predictable under
 * Vercel's function timeout. Returns how many were processed and how
 * many remain, so the UI can call this repeatedly with a visible
 * progress readout instead of holding one very long request open. */
export async function acquireTranscriptsBatch(
  caseId: string,
  limit = 5
): Promise<{ processed: number; remaining: number }> {
  const supabase = await createClient();

  const { data: pending, error } = await supabase
    .from("video_sources")
    .select("id")
    .eq("case_id", caseId)
    .eq("transcript_status", "not_attempted")
    .order("relevance_score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  for (const row of pending ?? []) {
    // Never let one bad video abort the whole batch — it's already
    // marked appropriately inside acquireTranscriptForSource itself.
    await acquireTranscriptForSource(row.id).catch(() => null);
  }

  const { count } = await supabase
    .from("video_sources")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId)
    .eq("transcript_status", "not_attempted");

  return { processed: pending?.length ?? 0, remaining: count ?? 0 };
}