import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { tavilyProvider } from "@/providers/search/tavilyProvider";

interface AngleContext {
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  openingHook: string;
  script: string | null;
}

interface CaseContext {
  name: string;
  summary: string | null;
}

export interface TitleSuggestion {
  title: string;
  formula: string;
}

async function loadContext(angleId: string): Promise<{ angle: AngleContext; caseData: CaseContext; caseId: string }> {
  const supabase = await createClient();

  const { data: angleRow, error: angleError } = await supabase
    .from("angles")
    .select("title, core_question, why_it_works, opening_hook, script, case_id")
    .eq("id", angleId)
    .single();

  if (angleError || !angleRow) {
    throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("name, summary")
    .eq("id", angleRow.case_id)
    .single();

  if (caseError || !caseRow) {
    throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);
  }

  return {
    angle: {
      title: angleRow.title,
      coreQuestion: angleRow.core_question,
      whyItWorks: angleRow.why_it_works,
      openingHook: angleRow.opening_hook,
      script: angleRow.script,
    },
    caseData: { name: caseRow.name, summary: caseRow.summary },
    caseId: angleRow.case_id,
  };
}

function parseJsonArray<T>(raw: string): T[] {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const a = cleaned.indexOf("[");
  const b = cleaned.lastIndexOf("]");
  if (a === -1 || b === -1) throw new Error(`No JSON array found in AI response: ${raw.slice(0, 200)}`);
  const parsed = JSON.parse(cleaned.slice(a, b + 1));
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
  return parsed;
}

function parseJsonObject<T>(raw: string): T {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(a, b + 1));
}

// ---------- Title Suggestions ----------

function buildTitlePrompt(caseData: CaseContext, angle: AngleContext): string {
  return `You are a YouTube title strategist for a true crime channel. Generate 8 title options for a video about "${caseData.name}", specifically covering this angle:

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}
OPENING HOOK: ${angle.openingHook}

Use a DIFFERENT proven YouTube title formula for each of the 8 titles, so the creator has real variety to choose from — for example: a direct curiosity-gap question, a shocking statement + location, a "The Truth About..." framing, a numbered/list angle if it fits, a name + fate framing ("What Really Happened to..."), a time-pressure framing, a contrast/twist framing, and an investigative-authority framing. Every title must be factually grounded in the case — do not invent details.

Return ONLY a valid JSON array of exactly 8 objects, no markdown, no commentary:
[
  { "title": string, "formula": string (a short 2-4 word label naming which formula this uses, e.g. "Curiosity Gap", "Shock + Location", "The Truth About") }
]

Return ONLY the JSON array.`;
}

export async function generateTitleSuggestions(angleId: string): Promise<TitleSuggestion[]> {
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate titles");
  }
  const { angle, caseData } = await loadContext(angleId);

  const raw = await groqProvider.generateText(buildTitlePrompt(caseData, angle), {
    temperature: 0.7,
    maxTokens: 900,
  });
  const titles = parseJsonArray<TitleSuggestion>(raw);

  const supabase = await createClient();
  await supabase.from("angles").update({ suggested_titles: titles }).eq("id", angleId);

  return titles;
}

// ---------- Description ----------

function buildDescriptionPrompt(caseData: CaseContext, angle: AngleContext): string {
  const scriptExcerpt = angle.script ? angle.script.slice(0, 1200) : null;

  return `You are writing a YouTube video description for a true crime channel, for a video about "${caseData.name}", covering this specific angle:

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
${scriptExcerpt ? `OPENING OF THE ACTUAL SCRIPT (use this for tone/specifics):\n${scriptExcerpt}` : `OPENING HOOK (script not written yet, use this for tone/specifics):\n${angle.openingHook}`}

CASE SUMMARY:
${caseData.summary ?? "Not yet researched."}

Write a complete, ready-to-publish YouTube description, structured as:
1. A 2-3 sentence hook paragraph that makes someone want to click, naturally including the case name and core searchable terms.
2. A short paragraph (2-4 sentences) summarizing what the video covers, grounded in real case facts only.
3. A line inviting the viewer to subscribe for more coverage like this — natural, not salesy.

Do not use markdown formatting, headers, or bullet points — this is a plain YouTube description field. Do not include hashtags or a tag list — that's handled separately.

Return ONLY valid JSON (no markdown, no commentary) matching:
{ "description": string }

Return ONLY the JSON object.`;
}

export async function generateDescription(angleId: string): Promise<string> {
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate a description");
  }
  const { angle, caseData } = await loadContext(angleId);

  const raw = await groqProvider.generateText(buildDescriptionPrompt(caseData, angle), {
    temperature: 0.5,
    maxTokens: 500,
  });
  const parsed = parseJsonObject<{ description: string }>(raw);

  const supabase = await createClient();
  await supabase.from("angles").update({ video_description: parsed.description }).eq("id", angleId);

  return parsed.description;
}

// ---------- Tags ----------

function buildTagsPrompt(caseData: CaseContext, angle: AngleContext, searchContext: string): string {
  return `You are a YouTube SEO specialist for a true crime channel, generating tags for a video about "${caseData.name}", covering this angle: "${angle.title}".

REAL SEARCH DATA ABOUT HOW PEOPLE ARE ACTUALLY SEARCHING FOR/DISCUSSING THIS CASE (use this to ground your tag choices in real search behavior, not guesses):
${searchContext || "No additional search data available — base tags on the case name and category only."}

CASE SUMMARY:
${caseData.summary ?? "Not yet researched."}

Generate 15-20 YouTube tags. Requirements:
- ONLY high-search-value terms: the case name (and realistic variations of it), the core case type/category ("true crime", "unsolved murder", "cold case", "missing person" — whichever genuinely apply), the location, and specific terms a real viewer would type into YouTube search when looking for this content.
- NO generic filler tags (no "video", "youtube", "2026", "subscribe", "viral").
- NO invented details not grounded in the case or search data above.
- Keep each tag short (1-4 words), the way real YouTube tags are written — not full sentences.

Return ONLY a valid JSON array of strings, no markdown, no commentary:
["tag one", "tag two", ...]

Return ONLY the JSON array.`;
}

export async function generateTags(angleId: string): Promise<string[]> {
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate tags");
  }
  const { angle, caseData } = await loadContext(angleId);

  let searchContext = "";
  if (tavilyProvider.isConfigured()) {
    try {
      const results = await tavilyProvider.search(`${caseData.name} true crime`, 6);
      searchContext = results.map((r, i) => `${i + 1}. [${r.title}] ${r.snippet}`).join("\n");
    } catch {
      searchContext = "";
    }
  }

  const raw = await groqProvider.generateText(buildTagsPrompt(caseData, angle, searchContext), {
    temperature: 0.4,
    maxTokens: 700,
  });
  const tags = parseJsonArray<string>(raw).map((t) => String(t).trim()).filter(Boolean);

  const supabase = await createClient();
  await supabase.from("angles").update({ tags }).eq("id", angleId);

  return tags;
}

export async function saveDescription(angleId: string, description: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("angles").update({ video_description: description }).eq("id", angleId);
  if (error) throw new Error(`Failed to save description: ${error.message}`);
}

export async function saveTags(angleId: string, tags: string[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("angles").update({ tags }).eq("id", angleId);
  if (error) throw new Error(`Failed to save tags: ${error.message}`);
}

export interface AngleMetadata {
  suggestedTitles: TitleSuggestion[] | null;
  description: string | null;
  tags: string[] | null;
}

export async function getAngleMetadata(angleId: string): Promise<AngleMetadata> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("angles")
    .select("suggested_titles, video_description, tags")
    .eq("id", angleId)
    .single();

  if (error || !data) {
    throw new Error(`Angle not found: ${error?.message ?? "unknown error"}`);
  }

  return {
    suggestedTitles: (data.suggested_titles as TitleSuggestion[] | null) ?? null,
    description: data.video_description ?? null,
    tags: (data.tags as string[] | null) ?? null,
  };
}