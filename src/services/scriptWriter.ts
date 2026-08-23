import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import { claudeProvider } from "@/providers/ai/claudeProvider";
import type { ChannelDNA } from "@/services/creatorDNA";
import { SCRIPT_WORD_COUNT_OPTIONS, type ScriptWordCount } from "@/constants/scriptOptions";

interface AngleForScript {
  id: string;
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
}

interface CaseForScript {
  name: string;
  summary: string | null;
}

interface ResearchBrief {
  caseFacts: string[];
  retentionPrinciples: string[];
  ctaGuidance: string;
}

export interface ScriptSeoSummary {
  keywords: string[];
  description: string;
}

interface SectionPlan {
  index: number;
  focus: string;
  targetWords: number;
  includeCTA: boolean;
}

export interface ScriptJobRow {
  id: string;
  angle_id: string;
  case_id: string;
  word_count: number;
  status: "writing" | "seo" | "complete" | "failed";
  brief: ResearchBrief;
  outline: string[];
  sections: string[];
  current_section_index: number;
  total_sections: number;
  previous_tail: string | null;
  channel_dna: ChannelDNA | null;
  error: string | null;
}

// ---------- prompt builders ----------

function buildResearchPrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  caseSourcesText: string,
  craftSourcesText: string
): string {
  return `You are a research analyst preparing a briefing for a true crime YouTube scriptwriter. Two source sets are provided below.

CASE: ${caseData.name}
ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}
SPECIFIC RESEARCH FOCUS FOR THIS ANGLE:
${angle.researchFocus.map((r) => `- ${r}`).join("\n")}

EXISTING CASE SUMMARY:
${caseData.summary ?? "No summary available."}

ADDITIONAL CASE SOURCES:
${caseSourcesText || "No additional sources found."}

YOUTUBE RETENTION / SCRIPTWRITING CRAFT SOURCES:
${craftSourcesText || "No additional craft sources found."}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "caseFacts": string[] (5-10 concrete, specific facts about this case relevant to the angle's core question and research focus — dates, roles, locations, documented events; do not invent anything not supported by the sources),
  "retentionPrinciples": string[] (5-8 specific, actionable YouTube script-retention techniques relevant to true crime storytelling — pacing, hook placement, information reveal order, tension structure),
  "ctaGuidance": string (2-3 sentences on natural points in a true crime narrative where a subscribe/follow prompt can be woven in without breaking immersion, described as principles, not literal script lines)
}

Keep every array item short and concrete — one sentence each — so the full response fits comfortably within the token budget. Return ONLY the JSON object.`;
}

function extractStringField(text: string, key: string): string {
  const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = text.match(re);
  if (!m) return "";
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return m[1];
  }
}

function extractArrayField(text: string, key: string): string[] {
  const keyIdx = text.indexOf(`"${key}"`);
  if (keyIdx === -1) return [];
  const bracketStart = text.indexOf("[", keyIdx);
  if (bracketStart === -1) return [];

  let depth = 0;
  let sliceEnd = text.length;
  for (let i = bracketStart; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) {
        sliceEnd = i + 1;
        break;
      }
    }
  }

  const candidate = text.slice(bracketStart, sliceEnd);
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {
    const matches = candidate.match(/"((?:[^"\\]|\\.)*)"/g) ?? [];
    return matches
      .map((m) => {
        try {
          return JSON.parse(m) as string;
        } catch {
          return null;
        }
      })
      .filter((v): v is string => v !== null);
  }
  return [];
}

function parseResearchBrief(raw: string): ResearchBrief {
  const cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }
  const fromFirstBrace = cleaned.slice(firstBrace);
  const lastBrace = fromFirstBrace.lastIndexOf("}");

  if (lastBrace !== -1) {
    try {
      const parsed = JSON.parse(fromFirstBrace.slice(0, lastBrace + 1));
      if (Array.isArray(parsed.caseFacts) && parsed.caseFacts.length > 0) {
        return parsed;
      }
    } catch {
      // fall through to salvage
    }
  }

  const caseFacts = extractArrayField(fromFirstBrace, "caseFacts");
  const retentionPrinciples = extractArrayField(fromFirstBrace, "retentionPrinciples");
  const ctaGuidance = extractStringField(fromFirstBrace, "ctaGuidance");

  if (caseFacts.length === 0) {
    throw new Error(`Could not salvage research brief from truncated AI response: ${raw.slice(0, 200)}`);
  }

  return {
    caseFacts,
    retentionPrinciples:
      retentionPrinciples.length > 0
        ? retentionPrinciples
        : ["Maintain a steady, controlled pace and reveal information incrementally."],
    ctaGuidance: ctaGuidance || "Weave a natural subscribe prompt in after a tension peak, before a scene transition.",
  };
}

function parseJsonArray(raw: string): string[] {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error(`No JSON array found in AI response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
  return parsed.map((v) => String(v));
}

function parseJsonObject<T>(raw: string): T {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(cleaned);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

/** ~2,600 words/section — fewer, larger sections means fewer sequential
 * round-trips overall, even though each is now its own request. */
function sectionCountFor(wordCount: ScriptWordCount): number {
  return Math.max(2, Math.ceil(wordCount / 2600));
}

function buildOutlinePrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  brief: ResearchBrief,
  sectionCount: number
): string {
  return `You are structuring a ${sectionCount}-part narration script outline for a true crime YouTube video about "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}

CASE FACTS AVAILABLE:
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

Return ONLY a valid JSON array of exactly ${sectionCount} short strings. Each string is a one-line description of what that section of the narration should cover, in strict order, building toward fully answering the core question by the final section. Do not number them yourself. Return ONLY the JSON array, nothing else.`;
}

function buildSectionPlan(wordCount: number, outline: string[]): SectionPlan[] {
  const n = outline.length;
  const base = Math.floor(wordCount / n);
  const remainder = wordCount - base * n;
  const ctaFirst = n <= 2 ? 0 : Math.max(1, Math.floor(n / 3));
  const ctaSecond = n <= 2 ? n - 1 : Math.min(n - 1, Math.floor((2 * n) / 3));
  return outline.map((focus, i) => ({
    index: i,
    focus,
    targetWords: base + (i === n - 1 ? remainder : 0),
    includeCTA: i === ctaFirst || i === ctaSecond,
  }));
}

function buildSectionPrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  brief: ResearchBrief,
  dna: ChannelDNA | null,
  outline: string[],
  plan: SectionPlan,
  previousTail: string | null
): string {
  const dnaBlock = dna
    ? `CHANNEL VOICE TO WRITE IN:
- Storytelling style: ${dna.channelStyle.storytellingStyle}
- Pacing: ${dna.channelStyle.averagePacing}
- Emotional tone: ${dna.channelStyle.emotionalTone}
- Typical hooks this channel uses: ${dna.channelStyle.typicalHooks.join(", ")}
- Narrative style (audience-preferred): ${dna.audienceDNA.narrativeStyle}
- Evidence emphasis audience responds to: ${dna.audienceDNA.evidenceWeight.join(", ")}
- Content freshness framing: ${dna.audienceDNA.contentFreshness}`
    : `No Channel DNA profile is available — write in a clear, engaging, emotionally grounded true crime documentary voice.`;

  const continuityBlock = previousTail
    ? `THE NARRATION SO FAR ENDS WITH:\n"...${previousTail}"\n\nContinue DIRECTLY from this point — do not repeat, recap, or restart. Pick up exactly where it left off, same voice, same tense.`
    : `THIS IS THE OPENING of the full script. Open with this hook direction, in your own words: ${angle.openingHook}`;

  const ctaBlock = plan.includeCTA
    ? `Include exactly ONE natural, spoken subscribe/follow moment in this section, phrased as a line the narrator would actually say — not labeled, not bracketed. Use this guidance for where/how it fits naturally:\n${brief.ctaGuidance}`
    : `Do not include any subscribe/follow prompt in this section.`;

  const seoBlock =
    plan.index === 0
      ? `SEO REQUIREMENT FOR THIS OPENING SECTION: within the first two sentences, naturally speak the full case name/subject ("${caseData.name}") and its core searchable category (e.g. missing person case, unsolved murder, cold case — whichever fits) so the transcript matches what viewers actually search for. Never say the words "SEO" or "keywords" out loud.`
      : plan.index === outline.length - 1
      ? `SEO REQUIREMENT FOR THIS FINAL SECTION: close on a sentence that naturally reinforces the case name/subject and core topic in plain spoken language, so the ending of the transcript stays topically relevant for search and suggested placement.`
      : `SEO REQUIREMENT: naturally reuse the case name/subject and closely related search phrases at least once in this section, at a natural spoken cadence — never forced, never listy.`;

  return `You are a professional true crime YouTube scriptwriter, mid-way through writing a full narration script about "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

${dnaBlock}

FULL SCRIPT OUTLINE (for your awareness of the whole arc — you are only writing ONE section of it now):
${outline.map((o, i) => `${i + 1}. ${o}${i === plan.index ? "   <-- YOU ARE WRITING THIS SECTION NOW" : ""}`).join("\n")}

CASE FACTS TO DRAW FROM (use these, do not invent facts beyond them):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

RETENTION TECHNIQUES TO APPLY (structurally, not by naming them):
${brief.retentionPrinciples.map((r) => `- ${r}`).join("\n")}

${continuityBlock}

${ctaBlock}

${seoBlock}

WRITE ONLY SECTION ${plan.index + 1} OF ${outline.length} NOW, focused on: "${plan.focus}"
Target length: approximately ${plan.targetWords} words for this section.

Requirements:
- Plain narration text only — no scene headers, no bracketed directions, no "[CUT TO]", no timestamps, no speaker labels, no markdown, no section title.
- Read exactly as a narrator would say it aloud.
- Do not write "in this section" or reference the outline — just write the narration itself.
- Do not include a preamble like "Here is the script" — output narration text only.
- Finish on a complete sentence. Do not cut off mid-thought.`;
}

function buildContinuationPrompt(caseData: CaseForScript, cutOffTail: string): string {
  return `You are continuing a true crime YouTube narration script about "${caseData.name}" that was cut off mid-sentence. Here is exactly how it ends:

"...${cutOffTail}"

Write ONLY the rest of that final unfinished sentence, plus one more sentence to close the thought naturally. Do not repeat any of the text above. Do not add a new idea or transition — just finish what was already being said. Plain narration text only, no preamble.`;
}

function endsCleanly(text: string): boolean {
  return /[.!?][")\u201d\u2019]?\s*$/.test(text.trim());
}

function buildSeoSummaryPrompt(caseData: CaseForScript, angle: AngleForScript, script: string): string {
  return `Based on the following true crime YouTube narration script about "${caseData.name}" (angle: "${angle.title}"), extract SEO metadata for the video upload.

SCRIPT EXCERPT:
${script.slice(0, 3000)}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "keywords": string[] (8-12 concrete search-relevant keywords/phrases actually reflected in this script, most relevant first),
  "description": string (a single, search-optimized 2-3 sentence YouTube video description, ready to publish as-is)
}
Return ONLY the JSON object.`;
}

// ---------- job steps ----------

/**
 * STEP 1 of 3. Runs research (Groq, truncation-tolerant) + outline (Groq) —
 * both quick, single calls — then creates a script_jobs row that the
 * remaining steps advance one section at a time. Kept fast enough to
 * comfortably finish in one request even on Vercel Hobby's 60s cap.
 */
export async function createScriptJob(
  angleId: string,
  caseId: string,
  wordCount: ScriptWordCount
): Promise<{ jobId: string; totalSections: number }> {
  if (!(SCRIPT_WORD_COUNT_OPTIONS as readonly number[]).includes(wordCount)) {
    throw new Error(`Invalid word count: ${wordCount}`);
  }
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot research this script");
  }
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot research this script");
  }
  if (!claudeProvider.isConfigured()) {
    throw new Error("Claude is not configured — cannot write this script");
  }

  const supabase = await createClient();

  const [{ data: angleRow, error: angleError }, { data: caseRow, error: caseError }] = await Promise.all([
    supabase
      .from("angles")
      .select("id, title, core_question, why_it_works, research_focus, opening_hook")
      .eq("id", angleId)
      .single(),
    supabase.from("cases").select("name, summary").eq("id", caseId).single(),
  ]);

  if (angleError || !angleRow) {
    throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  }
  if (caseError || !caseRow) {
    throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);
  }

  const angle: AngleForScript = {
    id: angleRow.id,
    title: angleRow.title,
    coreQuestion: angleRow.core_question,
    whyItWorks: angleRow.why_it_works,
    researchFocus: angleRow.research_focus,
    openingHook: angleRow.opening_hook,
  };

  let channelDNA: ChannelDNA | null = null;
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: activeRow } = await supabase
        .from("active_channel")
        .select("channel_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (activeRow?.channel_id) {
        const { data: channelRow } = await supabase
          .from("channels")
          .select("channel_dna")
          .eq("id", activeRow.channel_id)
          .maybeSingle();
        channelDNA = (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
      }
    }
  } catch {
    channelDNA = null;
  }

  const [caseSearchResults, craftSearchResults] = await Promise.all([
    tavilyProvider.search(`${caseRow.name} ${angle.researchFocus.slice(0, 3).join(" ")}`, 6),
    tavilyProvider.search("true crime youtube script retention techniques engaging storytelling", 6),
  ]);

  const caseSourcesText = caseSearchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");
  const craftSourcesText = craftSearchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");

  const researchRaw = await withRetry(() =>
    groqProvider.generateText(buildResearchPrompt(caseRow, angle, caseSourcesText, craftSourcesText), {
      temperature: 0.3,
      maxTokens: 2200,
    })
  );
  const brief = parseResearchBrief(researchRaw);

  const sectionCount = sectionCountFor(wordCount);
  const outlineRaw = await withRetry(() =>
    groqProvider.generateText(buildOutlinePrompt(caseRow, angle, brief, sectionCount), {
      temperature: 0.4,
      maxTokens: 700,
    })
  );
  let outline = parseJsonArray(outlineRaw);
  if (outline.length !== sectionCount) {
    outline = outline.slice(0, sectionCount);
    while (outline.length < sectionCount) {
      outline.push(`Continue the narrative toward answering: ${angle.coreQuestion}`);
    }
  }

  if (!userId) {
    throw new Error("You must be signed in to write a script.");
  }

  const { data: jobRow, error: insertError } = await supabase
    .from("script_jobs")
    .insert({
      user_id: userId,
      angle_id: angleId,
      case_id: caseId,
      word_count: wordCount,
      status: "writing",
      brief,
      outline,
      sections: [],
      current_section_index: 0,
      total_sections: sectionCount,
      previous_tail: null,
      channel_dna: channelDNA,
    })
    .select("id")
    .single();

  if (insertError || !jobRow) {
    throw new Error(`Failed to create script job: ${insertError?.message ?? "unknown error"}`);
  }

  return { jobId: jobRow.id, totalSections: sectionCount };
}

/**
 * STEP 2 of 3, called once per section. Writes exactly ONE section via
 * Claude (with a follow-up continuation call if it gets cut off
 * mid-sentence), appends it to the job row, and reports whether more
 * sections remain. Each call does at most two AI requests, so it stays
 * far under any serverless timeout regardless of total script length.
 */
export async function advanceScriptJob(
  jobId: string
): Promise<{ status: ScriptJobRow["status"]; sectionsCompleted: number; totalSections: number }> {
  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from("script_jobs")
    .select("*")
    .eq("id", jobId)
    .single<ScriptJobRow>();

  if (jobError || !job) {
    throw new Error(`Script job not found: ${jobError?.message ?? "unknown error"}`);
  }
  if (job.status !== "writing") {
    return { status: job.status, sectionsCompleted: job.sections.length, totalSections: job.total_sections };
  }

  const { data: angleRow, error: angleError } = await supabase
    .from("angles")
    .select("id, title, core_question, why_it_works, research_focus, opening_hook")
    .eq("id", job.angle_id)
    .single();
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("name, summary")
    .eq("id", job.case_id)
    .single();

  if (angleError || !angleRow) throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  if (caseError || !caseRow) throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);

  const angle: AngleForScript = {
    id: angleRow.id,
    title: angleRow.title,
    coreQuestion: angleRow.core_question,
    whyItWorks: angleRow.why_it_works,
    researchFocus: angleRow.research_focus,
    openingHook: angleRow.opening_hook,
  };

  const plans = buildSectionPlan(job.word_count, job.outline);
  const plan = plans[job.current_section_index];

  try {
    const maxTokens = Math.min(6000, Math.max(700, Math.ceil(plan.targetWords * 1.8)));
    const sectionRaw = await withRetry(() =>
      claudeProvider.generateText(
        buildSectionPrompt(caseRow, angle, job.brief, job.channel_dna, job.outline, plan, job.previous_tail),
        { temperature: 0.65, maxTokens }
      )
    );
    let sectionText = sectionRaw.trim();

    if (!endsCleanly(sectionText)) {
      try {
        const tail = sectionText.split(/\s+/).slice(-60).join(" ");
        const continuation = await claudeProvider.generateText(buildContinuationPrompt(caseRow, tail), {
          temperature: 0.65,
          maxTokens: 200,
        });
        sectionText = `${sectionText} ${continuation.trim()}`.trim();
      } catch {
        // Non-fatal — ship the section as-is.
      }
    }

    const updatedSections = [...job.sections, sectionText];
    const nextIndex = job.current_section_index + 1;
    const isDone = nextIndex >= job.total_sections;
    const previousTail = sectionText.split(/\s+/).slice(-120).join(" ");

    const { error: updateError } = await supabase
      .from("script_jobs")
      .update({
        sections: updatedSections,
        current_section_index: nextIndex,
        previous_tail: previousTail,
        status: isDone ? "seo" : "writing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) throw new Error(`Failed to save section progress: ${updateError.message}`);

    return {
      status: isDone ? "seo" : "writing",
      sectionsCompleted: nextIndex,
      totalSections: job.total_sections,
    };
  } catch (err) {
    await supabase
      .from("script_jobs")
      .update({ status: "failed", error: err instanceof Error ? err.message : "Unknown error" })
      .eq("id", jobId);
    throw err;
  }
}

/**
 * STEP 3 of 3. Joins the completed sections, runs a short Groq SEO pass,
 * saves the finished script to angles.script, and marks the job complete.
 */
export async function finalizeScriptJob(
  jobId: string
): Promise<{ script: string; wordCount: number; seo: ScriptSeoSummary | null }> {
  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from("script_jobs")
    .select("*")
    .eq("id", jobId)
    .single<ScriptJobRow>();

  if (jobError || !job) {
    throw new Error(`Script job not found: ${jobError?.message ?? "unknown error"}`);
  }
  if (job.status === "complete") {
    const { data: angleRow } = await supabase.from("angles").select("script").eq("id", job.angle_id).single();
    return {
      script: angleRow?.script ?? job.sections.join("\n\n"),
      wordCount: job.sections.join(" ").split(/\s+/).filter(Boolean).length,
      seo: null,
    };
  }
  if (job.status !== "seo") {
    throw new Error(`Script job is not ready to finalize (status: ${job.status})`);
  }

  const { data: angleRow, error: angleError } = await supabase
    .from("angles")
    .select("id, title, core_question, why_it_works, research_focus, opening_hook")
    .eq("id", job.angle_id)
    .single();
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("name, summary")
    .eq("id", job.case_id)
    .single();

  if (angleError || !angleRow) throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  if (caseError || !caseRow) throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);

  const angle: AngleForScript = {
    id: angleRow.id,
    title: angleRow.title,
    coreQuestion: angleRow.core_question,
    whyItWorks: angleRow.why_it_works,
    researchFocus: angleRow.research_focus,
    openingHook: angleRow.opening_hook,
  };

  const cleanScript = job.sections.join("\n\n").trim();
  const actualWordCount = cleanScript.split(/\s+/).filter(Boolean).length;

  let seo: ScriptSeoSummary | null = null;
  try {
    const seoRaw = await groqProvider.generateText(buildSeoSummaryPrompt(caseRow, angle, cleanScript), {
      temperature: 0.3,
      maxTokens: 400,
    });
    seo = parseJsonObject<ScriptSeoSummary>(seoRaw);
  } catch {
    seo = null;
  }

  const { error: saveError } = await supabase
    .from("angles")
    .update({ script: cleanScript, script_generated_at: new Date().toISOString() })
    .eq("id", job.angle_id);

  if (saveError) {
    throw new Error(`Failed to save script: ${saveError.message}`);
  }

  await supabase.from("script_jobs").update({ status: "complete", updated_at: new Date().toISOString() }).eq("id", jobId);

  return { script: cleanScript, wordCount: actualWordCount, seo };
}

/**
 * Looks up an in-progress job for this angle (status "writing" or "seo") so
 * the frontend can silently resume generation on page load — e.g. after a
 * tab was closed or a request dropped mid-script — instead of requiring a
 * manual "resume" action. A "failed" job is intentionally NOT returned
 * here: it's left alone so "Write Script" starts a clean new job rather
 * than retrying whatever caused the failure in a loop.
 */
export async function findActiveScriptJob(
  angleId: string
): Promise<{ jobId: string; status: "writing" | "seo"; sectionsCompleted: number; totalSections: number } | null> {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("script_jobs")
    .select("id, status, current_section_index, total_sections")
    .eq("angle_id", angleId)
    .in("status", ["writing", "seo"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!job) return null;

  return {
    jobId: job.id,
    status: job.status as "writing" | "seo",
    sectionsCompleted: job.current_section_index,
    totalSections: job.total_sections,
  };
}