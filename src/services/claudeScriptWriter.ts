import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import type { ChannelDNA } from "@/services/creatorDNA";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = process.env.ANTHROPIC_SCRIPT_MODEL ?? "claude-sonnet-5";

export const VALID_WORD_COUNTS = [5000, 7000, 10000] as const;
export type ValidWordCount = (typeof VALID_WORD_COUNTS)[number];

export function isValidWordCount(value: unknown): value is ValidWordCount {
  return typeof value === "number" && (VALID_WORD_COUNTS as readonly number[]).includes(value);
}

// Anthropic's list pricing as of this writing. Configurable via env so
// pricing updates don't require a code change.
const INPUT_COST_PER_M = parseFloat(process.env.ANTHROPIC_INPUT_COST_PER_M ?? "2.0");
const OUTPUT_COST_PER_M = parseFloat(process.env.ANTHROPIC_OUTPUT_COST_PER_M ?? "10.0");
const CACHE_WRITE_COST_PER_M = parseFloat(process.env.ANTHROPIC_CACHE_WRITE_COST_PER_M ?? "2.5");
const CACHE_READ_COST_PER_M = parseFloat(process.env.ANTHROPIC_CACHE_READ_COST_PER_M ?? "0.2");

interface CaseContext {
  name: string;
  summary: string | null;
}

interface AngleContext {
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
}

interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface GenerationUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  estimatedCostUsd: number;
}

interface ResearchBrief {
  caseFacts: string[];
  outline: string[];
}

interface SectionPlan {
  index: number;
  focus: string;
  targetWords: number;
}

export type ScriptJobStatus = "writing" | "ready" | "complete" | "failed";

export interface ScriptJobRow {
  id: string;
  user_id: string;
  case_id: string;
  angle_id: string;
  status: ScriptJobStatus;
  word_count: number;
  brief: ResearchBrief;
  outline: string[];
  sections: string[];
  current_section_index: number;
  total_sections: number;
  previous_tail: string | null;
  channel_dna: ChannelDNA | null;
  generation_id: string;
  usage: RawUsage;
  error: string | null;
}

/**
 * The VerityPulse Retention Engine — identical for every user/script, so
 * this is the single best prompt-caching candidate in the whole system.
 * Placed FIRST in the cached system block for exactly that reason.
 */
const RETENTION_ENGINE = `You are the lead writer for a high-retention true crime YouTube documentary channel. Your job is not simply to relay information — it is to make the viewer need to keep watching.

CORE PRINCIPLE: The viewer should discover the story rather than receive the story. Do not present known facts in chronological "police arrived, then interviewed witnesses, then found evidence" order. Build the narrative around what was UNKNOWN at each stage, and how that unknown resolved into a new question.

Every major section of the script should do at least one of:
1. Answer an existing open question
2. Introduce a MORE important question than the one it answers
3. Reveal evidence that recontextualizes something established earlier
4. Deepen the viewer's emotional understanding of the people involved

If a passage does none of these and provides no necessary factual context, it does not belong in the script.

HOOK RULE: The first 5-15 seconds must NOT begin with "My name is...", "Today we're going to talk about...", "In this video...", or a flat date-stamped opening ("On [date], something happened..."), unless there is an exceptional storytelling reason. Open instead with the most compelling unresolved question, contradiction, or discovery. Do not reveal the full mystery immediately — create a reason to keep watching.

STRUCTURAL TECHNIQUES to use throughout: progressive evidence release, open loops, mini-cliffhangers, recontextualization of earlier details, competing theories where the research actually supports them, investigation-progression pacing rather than pure biography.

FACTUAL DISCIPLINE — this is non-negotiable: distinguish CONFIRMED FACT from ALLEGATION, POLICE CLAIM, PROSECUTION CLAIM, DEFENSE CLAIM, REPORTING, and INFERENCE. Never present an allegation as established fact. Never invent dialogue, police statements, motives, or evidence. If the research does not establish something, say it remains unknown rather than filling the gap.

ETHICAL RULES: no glorification of killers, no exploitative treatment of victims, no graphic description beyond what's necessary and responsibly presented, no unsupported accusations.

VOICE: conversational, cinematic narration. Simple but powerful English. Minimal unnecessary biography — every biographical detail should serve the story, not pad it. Plain narration text only — no scene headers, no bracketed directions, no timestamps, no speaker labels, no markdown.

LENGTH DISCIPLINE: never pad to hit a word count. A shorter script should be tight and fast-moving with only the strongest evidence. A longer script should use the extra room for genuine additional depth — more evidence developments, competing theories, richer investigation progression — never filler.

CONTINUITY: you will sometimes be writing one section of a longer script that another instance of you started. When given "the narration so far ends with" text, continue DIRECTLY from that point — do not repeat, recap, restart, or re-introduce anything already covered. Pick up exactly where it left off, same voice, same tense.`;

function buildChannelBibleBlock(dna: ChannelDNA | null): string {
  if (!dna) {
    return "CHANNEL VOICE: No Channel DNA profile available yet — write in a clear, engaging, emotionally grounded true crime documentary voice.";
  }
  return `CHANNEL VOICE (this creator's specific identity — apply on top of the retention engine above):
- Storytelling style: ${dna.channelStyle.storytellingStyle}
- Pacing: ${dna.channelStyle.averagePacing}
- Emotional tone: ${dna.channelStyle.emotionalTone}
- Typical hooks this channel uses: ${dna.channelStyle.typicalHooks.join(", ")}
- Narrative style this audience prefers: ${dna.audienceDNA.narrativeStyle}
- Evidence emphasis this audience responds to: ${dna.audienceDNA.evidenceWeight.join(", ")}
- Content freshness framing: ${dna.audienceDNA.contentFreshness}`;
}

/** ~2,600 words/section — fewer, larger sections means fewer sequential
 * round-trips overall, even though each is now its own request. */
function sectionCountFor(wordCount: ValidWordCount): number {
  return Math.max(2, Math.ceil(wordCount / 2600));
}

function buildSectionPlan(wordCount: number, outline: string[]): SectionPlan[] {
  const n = outline.length;
  const base = Math.floor(wordCount / n);
  const remainder = wordCount - base * n;
  return outline.map((focus, i) => ({
    index: i,
    focus,
    targetWords: base + (i === n - 1 ? remainder : 0),
  }));
}

function buildResearchPrompt(
  caseData: CaseContext,
  angle: AngleContext,
  sectionCount: number,
  researchText: string
): string {
  return `You are a research analyst preparing a structured briefing for a true crime YouTube scriptwriter working on "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}
RESEARCH FOCUS: ${angle.researchFocus.join("; ")}

${caseData.summary ? `EXISTING CASE SUMMARY:\n${caseData.summary}\n` : ""}
SOURCE MATERIAL:
${researchText}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "caseFacts": string[] (8-15 concrete, specific facts from the source material — dates, names, roles, evidence, statements, distinguishing CONFIRMED FACT from ALLEGATION/CLAIM/REPORTING where the sources make that distinction; do not invent anything not supported by the sources),
  "outline": string[] (exactly ${sectionCount} items — a one-line description of what each section of the narration should cover, in strict order, building toward fully answering the core question by the final section; do not number them yourself)
}

Return ONLY the JSON object.`;
}

function buildSectionPrompt(
  caseData: CaseContext,
  angle: AngleContext,
  brief: ResearchBrief,
  outline: string[],
  plan: SectionPlan,
  previousTail: string | null
): string {
  const continuityBlock = previousTail
    ? `THE NARRATION SO FAR ENDS WITH:\n"...${previousTail}"`
    : `THIS IS THE OPENING of the full script. Open with this hook direction, in your own words: ${angle.openingHook}`;

  return `Continue writing the narration script for "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

CASE FACTS TO DRAW FROM (do not invent facts beyond these):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

FULL SCRIPT OUTLINE (for your awareness of the whole arc — you are only writing ONE section of it now):
${outline.map((o, i) => `${i + 1}. ${o}${i === plan.index ? "   <-- YOU ARE WRITING THIS SECTION NOW" : ""}`).join("\n")}

${continuityBlock}

WRITE ONLY SECTION ${plan.index + 1} OF ${outline.length} NOW, focused on: "${plan.focus}"
Target length: approximately ${plan.targetWords} words for this section.

Do not write a preamble like "Here is the script." Do not include a section title. Output narration text only. Finish on a complete sentence — do not cut off mid-thought.`;
}

function parseJsonObject<T>(raw: string): T {
  const cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");

  try {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
  } catch {
    // fall through to repair
  }

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 300)}`);
  }

  let attempt = cleaned.slice(firstBrace);
  const lastComma = attempt.lastIndexOf(",");
  const lastCloseBracket = Math.max(attempt.lastIndexOf("]"), attempt.lastIndexOf("}"));
  if (lastComma > lastCloseBracket) {
    attempt = attempt.slice(0, lastComma);
  }

  const openBraces = (attempt.match(/\{/g) ?? []).length;
  const closeBraces = (attempt.match(/\}/g) ?? []).length;
  const openBrackets = (attempt.match(/\[/g) ?? []).length;
  const closeBrackets = (attempt.match(/\]/g) ?? []).length;

  attempt += "]".repeat(Math.max(0, openBrackets - closeBrackets));
  attempt += "}".repeat(Math.max(0, openBraces - closeBraces));

  try {
    return JSON.parse(attempt);
  } catch {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 300)}`);
  }
}

async function loadContext(
  angleId: string,
  caseId: string,
  userId: string
): Promise<{ angle: AngleContext; caseData: CaseContext; channelDNA: ChannelDNA | null }> {
  const supabase = await createClient();

  const [{ data: angleRow, error: angleError }, { data: caseRow, error: caseError }] = await Promise.all([
    supabase
      .from("angles")
      .select("title, core_question, why_it_works, research_focus, opening_hook")
      .eq("id", angleId)
      .eq("case_id", caseId)
      .single(),
    supabase.from("cases").select("name, summary").eq("id", caseId).single(),
  ]);

  if (angleError || !angleRow) throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  if (caseError || !caseRow) throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);

  let channelDNA: ChannelDNA | null = null;
  try {
    const { data: activeRow } = await supabase
      .from("active_channel")
      .select("channel_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (activeRow?.channel_id) {
      const { data: channelRow } = await supabase
        .from("channels")
        .select("channel_dna")
        .eq("id", activeRow.channel_id)
        .maybeSingle();
      channelDNA = (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
    }
  } catch {
    channelDNA = null;
  }

  return {
    angle: {
      title: angleRow.title,
      coreQuestion: angleRow.core_question,
      whyItWorks: angleRow.why_it_works,
      researchFocus: angleRow.research_focus,
      openingHook: angleRow.opening_hook,
    },
    caseData: { name: caseRow.name, summary: caseRow.summary },
    channelDNA,
  };
}

function mergeUsage(a: RawUsage, b: RawUsage): RawUsage {
  return {
    input_tokens: (a.input_tokens ?? 0) + (b.input_tokens ?? 0),
    output_tokens: (a.output_tokens ?? 0) + (b.output_tokens ?? 0),
    cache_creation_input_tokens: (a.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0),
    cache_read_input_tokens: (a.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0),
  };
}

function estimateCost(usage: RawUsage): number {
  const input = ((usage.input_tokens ?? 0) / 1_000_000) * INPUT_COST_PER_M;
  const output = ((usage.output_tokens ?? 0) / 1_000_000) * OUTPUT_COST_PER_M;
  const cacheWrite = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * CACHE_WRITE_COST_PER_M;
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * CACHE_READ_COST_PER_M;
  return input + output + cacheWrite + cacheRead;
}

function toGenerationUsage(raw: RawUsage): GenerationUsage {
  return {
    inputTokens: raw.input_tokens ?? 0,
    outputTokens: raw.output_tokens ?? 0,
    cacheCreationInputTokens: raw.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: raw.cache_read_input_tokens ?? 0,
    estimatedCostUsd: estimateCost(raw),
  };
}

/**
 * Low-level Claude call. No `temperature` is sent — some models (extended
 * -thinking variants in particular) reject a fixed temperature outright
 * with a 400 ("'temperature' is deprecated for this model"), so this
 * omits it entirely and relies on Claude's own default rather than
 * special-casing model strings.
 */
async function callClaude(
  systemBlocks: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[] | undefined,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage: RawUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      ...(systemBlocks ? { system: systemBlocks } : {}),
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const error = new Error(`Claude request failed: ${res.status} ${res.statusText} ${errorBody.slice(0, 300)}`) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("")
    .trim();

  return { text, usage: data.usage ?? {} };
}

/**
 * Script generation is split into three steps the client drives one at a
 * time, so no single HTTP request is ever a long blocking Claude call —
 * this is what prevents Vercel from killing a request mid-generation
 * (which happened repeatedly with the old single-call design: the
 * function hit its 60s ceiling while Claude was still producing tokens,
 * so the app showed a dead 504 while Anthropic still billed for
 * whatever had already been generated).
 *
 *   1. startScriptJob   — research (Tavily) + ONE Claude call that
 *      produces case facts + a section outline. Fast, cheap, no prose.
 *   2. advanceScriptJob — writes exactly ONE section of prose per call,
 *      carrying the previous section's tail forward for continuity.
 *      The client calls this repeatedly until every section is done.
 *   3. finalizeScriptJob — joins the sections and saves the finished
 *      script to the angle.
 *
 * Usage/cost accumulates across every Claude call in the job (stored on
 * the job row) and is only reported to entitlements.completeGeneration
 * once, at finish — so billing reflects the whole script, not each call.
 */
export async function generateScript(
  angleId: string,
  caseId: string,
  wordCount: ValidWordCount,
  userId?: string
): Promise<{ script: string; usage: GenerationUsage; durationMs: number }> {
  const supabase = await createClient();
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;

  if (!resolvedUserId) {
    throw new Error("Authentication required.");
  }

  const generationId = `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();
  const { jobId, totalSections } = await startScriptJob(angleId, caseId, resolvedUserId, wordCount, generationId);

  let status: ScriptJobStatus = "writing";
  let sectionsCompleted = 0;

  while (status === "writing" && sectionsCompleted < totalSections) {
    const result = await advanceScriptJob(jobId, resolvedUserId);
    status = result.status;
    sectionsCompleted = result.sectionsCompleted;
  }

  const finished = await finalizeScriptJob(jobId, resolvedUserId);

  return {
    script: finished.script,
    usage: finished.usage,
    durationMs: Date.now() - startedAt,
  };
}

export async function startScriptJob(
  angleId: string,
  caseId: string,
  userId: string,
  wordCount: ValidWordCount,
  generationId: string
): Promise<{ jobId: string; totalSections: number }> {
  const { angle, caseData, channelDNA } = await loadContext(angleId, caseId, userId);

  let researchText = "No additional research available beyond the case summary above.";
  if (tavilyProvider.isConfigured()) {
    try {
      const results = await tavilyProvider.search(
        `${caseData.name} ${angle.researchFocus.slice(0, 3).join(" ")}`,
        6
      );
      researchText = results.map((r, i) => `${i + 1}. [${r.title}] ${r.snippet}`).join("\n");
    } catch {
      // Non-fatal — proceed with just the case summary.
    }
  }

  const sectionCount = sectionCountFor(wordCount);
  const { text: briefRaw, usage } = await callClaude(
    undefined,
    buildResearchPrompt(caseData, angle, sectionCount, researchText),
    2200
  );
  const brief = parseJsonObject<ResearchBrief>(briefRaw);
  let outline = brief.outline;
  if (outline.length !== sectionCount) {
    outline = outline.slice(0, sectionCount);
    while (outline.length < sectionCount) {
      outline.push(`Continue the narrative toward answering: ${angle.coreQuestion}`);
    }
  }

  const supabase = await createClient();
  const { data: jobRow, error: insertError } = await supabase
    .from("script_jobs")
    .insert({
      user_id: userId,
      case_id: caseId,
      angle_id: angleId,
      status: "writing",
      word_count: wordCount,
      brief: { caseFacts: brief.caseFacts, outline },
      outline,
      sections: [],
      current_section_index: 0,
      total_sections: sectionCount,
      previous_tail: null,
      channel_dna: channelDNA,
      generation_id: generationId,
      usage,
    })
    .select("id")
    .single();

  if (insertError || !jobRow) {
    throw new Error(`Failed to create script job: ${insertError?.message ?? "unknown error"}`);
  }

  return { jobId: jobRow.id, totalSections: sectionCount };
}

/** Writes exactly one section for an in-progress job and persists progress. */
export async function advanceScriptJob(
  jobId: string,
  userId: string
): Promise<{ status: ScriptJobStatus; sectionsCompleted: number; totalSections: number }> {
  const supabase = await createClient();

  const { data: job, error: fetchError } = await supabase
    .from("script_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single<ScriptJobRow>();

  if (fetchError || !job) {
    throw new Error(`Script job not found: ${fetchError?.message ?? "unknown error"}`);
  }
  if (job.status !== "writing") {
    return { status: job.status, sectionsCompleted: job.current_section_index, totalSections: job.total_sections };
  }

  const { angle, caseData } = await loadContext(job.angle_id, job.case_id, userId);
  const plans = buildSectionPlan(job.word_count, job.outline);
  const plan = plans[job.current_section_index];

  try {
    const maxTokens = Math.min(8192, Math.max(700, Math.ceil(plan.targetWords * 1.8)));
    const channelBible = buildChannelBibleBlock(job.channel_dna);
    const { text: sectionText, usage: sectionUsage } = await callClaude(
      [
        { type: "text", text: RETENTION_ENGINE, cache_control: { type: "ephemeral" } },
        { type: "text", text: channelBible, cache_control: { type: "ephemeral" } },
      ],
      buildSectionPrompt(caseData, angle, job.brief, job.outline, plan, job.previous_tail),
      maxTokens
    );

    const newSections = [...job.sections, sectionText];
    const newIndex = job.current_section_index + 1;
    const done = newIndex >= job.total_sections;
    const newTail = sectionText.split(/\s+/).slice(-120).join(" ");
    const newUsage = mergeUsage(job.usage, sectionUsage);

    const { error: updateError } = await supabase
      .from("script_jobs")
      .update({
        sections: newSections,
        current_section_index: newIndex,
        previous_tail: newTail,
        status: done ? "ready" : "writing",
        usage: newUsage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) throw new Error(`Failed to save section progress: ${updateError.message}`);

    return { status: done ? "ready" : "writing", sectionsCompleted: newIndex, totalSections: job.total_sections };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write section";
    await supabase
      .from("script_jobs")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    throw err instanceof Error ? err : new Error(message);
  }
}

/** Joins the completed sections and saves the finished script to the angle. */
export async function finalizeScriptJob(
  jobId: string,
  userId: string
): Promise<{ script: string; wordCount: number; usage: GenerationUsage; generationId: string }> {
  const supabase = await createClient();

  const { data: job, error: fetchError } = await supabase
    .from("script_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single<ScriptJobRow>();

  if (fetchError || !job) {
    throw new Error(`Script job not found: ${fetchError?.message ?? "unknown error"}`);
  }

  if (job.status === "complete") {
    const { data: angleRow } = await supabase.from("angles").select("script").eq("id", job.angle_id).single();
    const cleanScript = angleRow?.script ?? job.sections.join("\n\n");
    return {
      script: cleanScript,
      wordCount: cleanScript.split(/\s+/).filter(Boolean).length,
      usage: toGenerationUsage(job.usage),
      generationId: job.generation_id,
    };
  }
  if (job.status !== "ready") {
    throw new Error(`Script job is not ready to finalize (status: ${job.status})`);
  }

  const cleanScript = job.sections.join("\n\n").trim();
  const wordCount = cleanScript.split(/\s+/).filter(Boolean).length;

  const { error: saveError } = await supabase
    .from("angles")
    .update({ script: cleanScript, script_generated_at: new Date().toISOString() })
    .eq("id", job.angle_id);

  if (saveError) {
    throw new Error(`Failed to save script: ${saveError.message}`);
  }

  await supabase
    .from("script_jobs")
    .update({ status: "complete", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  return { script: cleanScript, wordCount, usage: toGenerationUsage(job.usage), generationId: job.generation_id };
}

/** Lets the frontend silently resume an in-progress job on load — a
 * "failed" job is intentionally not returned, so a genuine error starts
 * a clean new job rather than retrying whatever broke in a loop. */
export async function findActiveScriptJob(
  angleId: string,
  userId: string
): Promise<{ jobId: string; status: "writing" | "ready"; sectionsCompleted: number; totalSections: number } | null> {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("script_jobs")
    .select("id, status, current_section_index, total_sections")
    .eq("angle_id", angleId)
    .eq("user_id", userId)
    .in("status", ["writing", "ready"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!job) return null;

  return {
    jobId: job.id,
    status: job.status as "writing" | "ready",
    sectionsCompleted: job.current_section_index,
    totalSections: job.total_sections,
  };
}