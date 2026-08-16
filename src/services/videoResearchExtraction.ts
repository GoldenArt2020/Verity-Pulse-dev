import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";

interface ExtractionResult {
  people: { name: string; role: string; mentions: string[] }[];
  locations: { name: string; context: string }[];
  dates: { date: string; event: string }[];
  claims: { text: string; timestamp: number | null }[];
  quotations: { text: string; speaker: string | null; timestamp: number | null }[];
  leads: { description: string }[];
}

const EMPTY_RESULT: ExtractionResult = {
  people: [],
  locations: [],
  dates: [],
  claims: [],
  quotations: [],
  leads: [],
};

function buildExtractionPrompt(caseName: string, videoTitle: string, transcript: string): string {
  // Cap input — extraction needs coverage, not the entire hour-long
  // transcript verbatim; a long enough excerpt captures nearly all
  // factual content in practice while keeping this call fast and cheap.
  const excerpt = transcript.length > 12000 ? `${transcript.slice(0, 12000)}…` : transcript;

  return `You are a research analyst extracting structured facts from a YouTube video transcript about the case "${caseName}". Video title: "${videoTitle}".

TRANSCRIPT:
${excerpt}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "people": [ { "name": string, "role": string (e.g. "victim", "suspect", "witness", "investigator", "lawyer", "family member"), "mentions": string[] (1-2 short facts stated about them) } ],
  "locations": [ { "name": string, "context": string (how it relates to the case, e.g. "crime scene", "suspect's residence") } ],
  "dates": [ { "date": string (as specific as stated), "event": string } ],
  "claims": [ { "text": string (a single factual assertion made in the video, stated plainly, third person, not a quote), "timestamp": number or null (seconds into the video, if determinable from context, else null) } ],
  "quotations": [ { "text": string (short, under 25 words, exact as said), "speaker": string or null, "timestamp": number or null } ],
  "leads": [ { "description": string (something mentioned that could warrant further investigation/research — an unexplained detail, an unanswered question, a name mentioned without context) } ]
}

Only extract what is actually stated in the transcript — never infer or add outside knowledge. If a field has nothing to report, return an empty array. Return ONLY the JSON object.`;
}

function parseExtraction(raw: string): ExtractionResult {
  const cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return EMPTY_RESULT;
  try {
    const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    return { ...EMPTY_RESULT, ...parsed };
  } catch {
    return EMPTY_RESULT;
  }
}

/** Runs research extraction for one source's already-cleaned transcript
 * and saves the structured result. A transcript that's missing or empty
 * simply gets no extraction row — this never fabricates content from a
 * source that has none. */
export async function extractResearchForSource(sourceId: string, caseName: string): Promise<void> {
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("video_sources")
    .select("video_title")
    .eq("id", sourceId)
    .single();

  const { data: transcriptRow } = await supabase
    .from("video_transcripts")
    .select("cleaned_transcript")
    .eq("source_id", sourceId)
    .maybeSingle();

  const transcript = transcriptRow?.cleaned_transcript;
  if (!transcript || !source) return;

  const raw = await groqProvider.generateText(buildExtractionPrompt(caseName, source.video_title, transcript), {
    temperature: 0.2,
    maxTokens: 2500,
  });
  const result = parseExtraction(raw);

  await supabase.from("video_source_extractions").upsert(
    {
      source_id: sourceId,
      people: result.people,
      locations: result.locations,
      dates: result.dates,
      claims: result.claims,
      quotations: result.quotations,
      leads: result.leads,
    },
    { onConflict: "source_id" }
  );
}

/** Bounded batch, same pattern as transcript acquisition — processes up
 * to `limit` sources that have a transcript but no extraction yet. */
export async function extractResearchBatch(
  caseId: string,
  caseName: string,
  limit = 5
): Promise<{ processed: number; remaining: number }> {
  const supabase = await createClient();

  const { data: candidates } = await supabase
    .from("video_sources")
    .select("id, video_transcripts!inner(source_id), video_source_extractions(source_id)")
    .eq("case_id", caseId)
    .eq("transcript_status", "available")
    .is("video_source_extractions.source_id", null)
    .limit(limit);

  for (const row of candidates ?? []) {
    await extractResearchForSource(row.id, caseName).catch(() => null);
  }

  const { count } = await supabase
    .from("video_sources")
    .select("id, video_transcripts!inner(source_id), video_source_extractions(source_id)", {
      count: "exact",
      head: true,
    })
    .eq("case_id", caseId)
    .eq("transcript_status", "available")
    .is("video_source_extractions.source_id", null);

  return { processed: candidates?.length ?? 0, remaining: count ?? 0 };
}