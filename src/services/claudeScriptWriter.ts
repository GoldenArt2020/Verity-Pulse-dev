import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { groqProvider } from "@/providers/ai/groqProvider";
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
  lastUpdated: string | null;
  category: string | null;
  solvedStatus: string | null;
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

interface PersonFact {
  name: string;
  role: "victim" | "accused" | "perpetrator" | "official" | "other";
  outcome: string;
  confessionStatus: string | null;
  aliveStatus: string;
}

interface ResearchBrief {
  caseFacts: string[];
  peopleFacts: PersonFact[];
  outline: string[];
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

Every major beat of the script should do at least one of:
1. Answer an existing open question
2. Introduce a MORE important question than the one it answers
3. Reveal evidence that recontextualizes something established earlier
4. Deepen the viewer's emotional understanding of the people involved

HUMAN GROUNDING — do not skip this: every central figure named more than once in the script (victims, accused, and any other person the story turns on) needs at least one concrete detail of who they were as a person before the case — an interest, a relationship, a job, a personality trait, something a person who knew them said. Names and ages alone are not enough. If the research material doesn't support this for someone, say plainly that little is known about them rather than silently leaving them as a name on a list.

If a passage does none of these and provides no necessary factual context, it does not belong in the script.

HOOK RULE: The first 5-15 seconds must NOT begin with "My name is...", "Today we're going to talk about...", "In this video...", or a flat date-stamped opening ("On [date], something happened..."), unless there is an exceptional storytelling reason. Open instead with the most compelling unresolved question, contradiction, or discovery. Do not reveal the full mystery immediately — create a reason to keep watching.

STRUCTURAL TECHNIQUES to use throughout: progressive evidence release, open loops, mini-cliffhangers, recontextualization of earlier details, competing theories where the research actually supports them, investigation-progression pacing rather than pure biography.

BANNED PHRASES AND PATTERNS — these are overused AI-narration tics. Do not use them, or close paraphrases of them, anywhere in the script:
- Direct-address filler: "Let that sink in," "Let that sit for a moment," "Sit with that," "Think about that for a second," "Take a moment to consider..."
- Meta-narration about the story itself: "This is the part of the story most people never hear," "Here's where it gets interesting," "But here's the thing," "And that's when everything changed."
- Staccato name- or fact-listing for false gravity: stacking short sentence fragments back-to-back purely for rhythm ("Name. Name. Name. Name." or "One question. Then another. Then silence."). Names and facts should appear inside real sentences unless a fragment serves a specific, earned beat — not as a recurring structural device.
- Manufactured rhetorical questions the narrator immediately answers: "So what really happened? The answer is..." Ask a question only when the answer is genuinely still open at that point in the script.
- Symmetrical, checklist-style wrap-ups that address every party in turn (victims, then accused, then system, then society) with matched sentence structures. Endings should follow from what the specific story earned, not a template.
- Empty scene-setting intensifiers: "little did they know," "what happened next would shock the nation," "nothing could have prepared them for..."

If you notice yourself reaching for one of these because the moment feels like it needs a dramatic beat, find a concrete detail from the case facts instead — specificity creates the tension these phrases are trying to fake.

FACTUAL DISCIPLINE — this is non-negotiable: distinguish CONFIRMED FACT from ALLEGATION, POLICE CLAIM, PROSECUTION CLAIM, DEFENSE CLAIM, REPORTING, and INFERENCE. Never present an allegation as established fact. Never invent dialogue, police statements, motives, or evidence. If the research brief does not establish something, say it remains unknown rather than filling the gap — but say this narrowly and honestly: "this script doesn't go into X" or simply omit the point, never "the historical record doesn't preserve X" or "this isn't publicly documented." A gap in your research brief is not evidence of a gap in the historical record, and claiming the latter is itself a factual error. When the peopleFacts data distinguishes outcomes between individuals (who confessed, who was convicted, who received what sentence, who is alive), never collapse those into a single collective statement about the group — state each person's specific situation.

ETHICAL RULES: no glorification of killers, no exploitative treatment of victims, no graphic description beyond what's necessary and responsibly presented, no unsupported accusations.

VOICE: conversational, cinematic narration. Simple but powerful English. Minimal unnecessary biography — every biographical detail should serve the story, not pad it. Plain narration text only — no scene headers, no bracketed directions, no timestamps, no speaker labels, no markdown.

LENGTH DISCIPLINE: never pad to hit a word count. Use the full length for genuine additional depth — more evidence developments, competing theories, richer investigation progression — never filler.

CONTINUITY: if you are given "the narration so far ends with" text, you are continuing a script that was cut off mid-generation, not starting a new one. Continue DIRECTLY from that point — do not repeat, recap, restart, or re-introduce anything already covered. Pick up exactly where it left off, same voice, same tense.`;

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

function buildResearchPrompt(caseData: CaseContext, angle: AngleContext, researchText: string): string {
  return `You are a research analyst preparing a structured briefing for a true crime YouTube scriptwriter working on "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}
RESEARCH FOCUS: ${angle.researchFocus.join("; ")}

${caseData.summary ? `EXISTING CASE SUMMARY:\n${caseData.summary}\n` : ""}
SOURCE MATERIAL:
${researchText}

DATE AND COUNT ACCURACY — critical:
- If sources give different dates for related-but-distinct events (e.g. an initial announcement vs. a later formal court ruling vs. a settlement approval), treat them as SEPARATE events with SEPARATE dates. Do not collapse them into one date.
- When a specific number matters (how many people confessed, how many were convicted vs. arrested, how many years, dollar amounts), state exactly what the source material supports — do not round, estimate, or infer a rounder or more dramatic number.
- If two sources conflict on a date or count, note the discrepancy in the relevant fact rather than silently picking one.
- If the source material does not clearly establish a date or count you need for the outline, write the fact as approximate ("in [month/year], according to sources") rather than stating a specific date you are not confident in.

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "caseFacts": string[] (10-18 concrete, specific facts from the source material — dates, names, roles, evidence, statements, distinguishing CONFIRMED FACT from ALLEGATION/CLAIM/REPORTING where the sources make that distinction; do not invent anything not supported by the sources. Include BOTH event/procedural facts AND biographical/human facts: who each named person was before this case touched them — age, occupation, personality, relationships, what people who knew them said about them — for victims, the accused, and any other central figures the source material describes. If the source material contains little or no biographical detail for someone, say so explicitly as a fact rather than omitting them entirely, e.g. "Source material does not describe X's life before the case."),
  "peopleFacts": [{ "name": string, "role": "victim" | "accused" | "perpetrator" | "official" | "other", "outcome": string (specific — e.g. "sentenced to death, later exonerated" not "convicted"), "confessionStatus": string | null (only for accused; e.g. "confessed" / "did not confess" / "not stated in source material"), "aliveStatus": string (e.g. "alive as of [date]" / "died [year/date]" / "not stated in source material") }] (one entry per named individual who is a victim, accused/convicted person, or identified perpetrator — do not skip anyone the source material names in these roles),
  "outline": string[] (4-7 items — a one-line description of each major beat the narration should hit, in strict order, building toward fully answering the core question by the end; ensure at least one beat is dedicated to grounding the central people as people, not just as case participants, if the case facts support it; do not number them yourself)
}

Return ONLY the JSON object.`;
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
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<{ angle: AngleContext; caseData: CaseContext; channelDNA: ChannelDNA | null }> {
  const supabase = supabaseClient ?? createServiceClient();

  const [{ data: angleRow, error: angleError }, { data: caseRow, error: caseError }] = await Promise.all([
    supabase
      .from("angles")
      .select("title, core_question, why_it_works, research_focus, opening_hook")
      .eq("id", angleId)
      .eq("case_id", caseId)
      .single(),
    supabase
      .from("cases")
      .select("name, summary, last_updated, category, solved_status")
      .eq("id", caseId)
      .single(),
  ]);

  if (angleError || !angleRow) throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);
  if (caseError || !caseRow) throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);

  let channelDNA: ChannelDNA | null = null;
  if (userId) {
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
  }

  return {
    angle: {
      title: angleRow.title,
      coreQuestion: angleRow.core_question,
      whyItWorks: angleRow.why_it_works,
      researchFocus: angleRow.research_focus,
      openingHook: angleRow.opening_hook,
    },
    caseData: {
      name: caseRow.name,
      summary: caseRow.summary,
      lastUpdated: caseRow.last_updated,
      category: caseRow.category,
      solvedStatus: caseRow.solved_status,
    },
    channelDNA,
  };
}

// Scale Tavily's recency window to the case's most recent refresh. Recent
// cases benefit from news-focused searches; dormant cases need broad coverage.
function computeRecencyWindow(lastUpdated: string | null): { topic: "news" | "general"; days?: number } {
  if (!lastUpdated) {
    return { topic: "general" };
  }

  const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 0) {
    return { topic: "general" };
  }
  if (daysSinceUpdate <= 14) {
    return { topic: "news", days: 60 };
  }
  if (daysSinceUpdate <= 90) {
    return { topic: "news", days: 180 };
  }
  if (daysSinceUpdate <= 365) {
    return { topic: "news", days: 730 };
  }
  return { topic: "general" };
}

export async function getOrBuildResearchBrief(
  angleId: string,
  caseId: string,
  supabaseClient?: SupabaseClient,
  forceRefresh = false
): Promise<ResearchBrief> {
  const supabase = supabaseClient ?? createServiceClient();

  if (!forceRefresh) {
    const { data: existingAngle } = await supabase
      .from("angles")
      .select("research_brief")
      .eq("id", angleId)
      .maybeSingle();

    if (existingAngle?.research_brief) {
      return existingAngle.research_brief as ResearchBrief;
    }
  }

  const { angle, caseData } = await loadContext(angleId, caseId, "", supabase);

  let researchText = "No additional research available beyond the case summary above.";
  if (tavilyProvider.isConfigured()) {
    try {
      const newsOptions = computeRecencyWindow(caseData.lastUpdated);
      const dateQueries = [
        `${caseData.name} official timeline dates`,
        `${caseData.name} ${angle.researchFocus[0] ?? ""}`,
        `${caseData.name} announcement date confirmed`,
        `${caseData.name} sentencing outcome each defendant`,
        `${caseData.name} who confessed how many`,
        `${caseData.name} each defendant sentence outcome individually`,
      ];
      const bioQuery = `${caseData.name} victims remembered who they were`;
      const resultSets = await Promise.all(
        [
          ...dateQueries.map((query) => tavilyProvider.search(query, 4, newsOptions).catch(() => [])),
          tavilyProvider.search(bioQuery, 5, { topic: "general" }).catch(() => []),
        ]
      );
      const seen = new Set<string>();
      const merged = resultSets.flat().filter((result) => {
        if (seen.has(result.url)) return false;
        seen.add(result.url);
        return true;
      });
      researchText = merged
        .map((result, i) => {
          const dateTag = result.publishedDate ? ` (published ${result.publishedDate})` : "";
          return `${i + 1}. [${result.title}]${dateTag} ${result.snippet}`;
        })
        .join("\n");
    } catch {
      // Non-fatal — proceed with just the case summary.
    }
  }

  // Research extraction uses Claude, not Groq, for this specific call —
  // this is the factual foundation every downstream script, rewrite, and
  // verification pass relies on. Groq was found to collapse distinct
  // individuals' outcomes into one shared (and wrong) group statement even
  // with explicit per-person instructions and good source material.
  const { text: briefRaw } = await callClaude(undefined, buildResearchPrompt(caseData, angle, researchText), 4000);
  if (!briefRaw || !briefRaw.trim()) {
    throw new Error("Research brief generation returned an empty response from Claude");
  }
  const brief = parseJsonObject<ResearchBrief>(briefRaw);

  await supabase.from("angles").update({ research_brief: brief }).eq("id", angleId);

  return brief;
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

// No longer racing Vercel's 60s ceiling — this task runs inside Trigger.dev
// (up to 3600s), so this is just a sane per-request safety timeout, not a
// tight budget. Kept well under Trigger's own limit so a genuine hang
// fails cleanly instead of silently consuming the whole task duration.
const CLAUDE_TIMEOUT_MS = 240_000;

// Claude Sonnet 4.5's max output for a single response. A 10,000-word
// script is roughly 13,300 tokens, so this comfortably covers the largest
// supported word count in one call with headroom to spare.
const MAX_TOKENS_PER_CALL = 16000;

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
): Promise<{ text: string; usage: RawUsage; stopReason: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
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
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      const error = new Error(`Claude request timed out after ${CLAUDE_TIMEOUT_MS / 1000}s`) as Error & {
        status?: number;
      };
      error.status = 408;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }

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

  return { text, usage: data.usage ?? {}, stopReason: data.stop_reason ?? null };
}

function buildWritePrompt(
  caseData: CaseContext,
  angle: AngleContext,
  brief: ResearchBrief,
  wordCount: number,
  previousTail: string | null
): string {
  const continuityBlock = previousTail
    ? `THE NARRATION SO FAR ENDS WITH:\n"...${previousTail}"\n\nContinue DIRECTLY from this point.`
    : `Open with this hook direction, in your own words: ${angle.openingHook}`;

  return `Write the full narration script for "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

CASE FACTS TO DRAW FROM (do not invent facts beyond these):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

STRUCTURED PEOPLE FACTS (use each person's specific outcome and status; do not merge people):
${(brief.peopleFacts ?? []).map((person) => `- ${person.name} | role: ${person.role} | outcome: ${person.outcome} | confession: ${person.confessionStatus ?? "not applicable"} | alive status: ${person.aliveStatus}`).join("\n") || "No structured people facts available."}

NARRATIVE ARC TO COVER, IN ORDER:
${brief.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}

${continuityBlock}

Target total length: approximately ${wordCount} words for the complete script.

Write the narration now, straight through, as one continuous piece — no section headers, no bracketed directions, no timestamps, no speaker labels, no markdown, no preamble like "Here is the script." Finish on a complete sentence.`;
}

/**
 * Writes the entire script in ONE Claude call. No section splitting, no
 * continuation loop — this now runs inside a Trigger.dev task with up to
 * 3600s available, so there's no per-request time pressure forcing the
 * old chunked design. max_tokens is set high enough to cover the largest
 * supported word count (10,000 words ≈ 13,300 tokens) with real headroom.
 */
async function writeFullScript(
  caseData: CaseContext,
  angle: AngleContext,
  brief: ResearchBrief,
  wordCount: ValidWordCount,
  channelDNA: ChannelDNA | null
): Promise<{ script: string; usage: RawUsage }> {
  const systemBlocks: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[] = [
    { type: "text", text: RETENTION_ENGINE, cache_control: { type: "ephemeral" } },
    { type: "text", text: buildChannelBibleBlock(channelDNA), cache_control: { type: "ephemeral" } },
  ];

  const maxTokens = Math.min(MAX_TOKENS_PER_CALL, Math.max(2048, Math.ceil(wordCount * 2.2)));

  const { text, usage } = await callClaude(
    systemBlocks,
    buildWritePrompt(caseData, angle, brief, wordCount, null),
    maxTokens
  );

  return { script: text.trim(), usage };
}

/**
 * Full script pipeline: research (Tavily + Groq) once, then write the
 * whole script (writeFullScript above handles any necessary continuation
 * internally). Runs inside a Trigger.dev task (see src/trigger/writeScript.ts),
 * so it is not subject to Vercel's request timeout — the old design that
 * split writing into many small HTTP-polled sections existed only to work
 * around that limit and is no longer needed now that generation happens
 * in a long-running background task instead.
 */
export async function generateScript(
  angleId: string,
  caseId: string,
  wordCount: ValidWordCount,
  userId?: string
): Promise<{ script: string; usage: GenerationUsage; durationMs: number }> {
  const supabase = createServiceClient();
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;

  if (!resolvedUserId) {
    throw new Error("Authentication required.");
  }

  const generationId = `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();
  const { jobId } = await startScriptJob(angleId, caseId, resolvedUserId, wordCount, generationId);
  const result = await advanceScriptJob(jobId, resolvedUserId);

  if (result.status !== "ready" && result.status !== "complete") {
    throw new Error("Script generation did not complete");
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

  const briefRaw = await groqProvider.generateText(buildResearchPrompt(caseData, angle, researchText), {
    temperature: 0.3,
    maxTokens: 1800,
  });
  const brief = parseJsonObject<ResearchBrief>(briefRaw);
  if (!brief.outline?.length) {
    brief.outline = [`Cover the full arc of the case, answering: ${angle.coreQuestion}`];
  }

  const supabase = createServiceClient();
  const { data: jobRow, error: insertError } = await supabase
    .from("script_jobs")
    .insert({
      user_id: userId,
      case_id: caseId,
      angle_id: angleId,
      status: "writing",
      word_count: wordCount,
      brief: { caseFacts: brief.caseFacts, peopleFacts: brief.peopleFacts ?? [], outline: brief.outline },
      outline: brief.outline,
      sections: [],
      current_section_index: 0,
      total_sections: 1,
      previous_tail: null,
      channel_dna: channelDNA,
      generation_id: generationId,
      usage: {},
    })
    .select("id")
    .single();

  if (insertError || !jobRow) {
    throw new Error(`Failed to create script job: ${insertError?.message ?? "unknown error"}`);
  }

  return { jobId: jobRow.id, totalSections: 1 };
}

/**
 * Writes the ENTIRE script in this one call (via writeFullScript's
 * internal continuation loop, invisible to the caller) and marks the job
 * ready. Kept as a separate step from startScriptJob purely so the two
 * concerns (research vs. writing) stay separable and testable, not
 * because it needs to be a distinct HTTP round-trip anymore.
 */
export async function advanceScriptJob(
  jobId: string,
  userId: string
): Promise<{ status: ScriptJobStatus; sectionsCompleted: number; totalSections: number }> {
  const supabase = createServiceClient();

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

  try {
    const { script, usage: writeUsage } = await writeFullScript(
      caseData,
      angle,
      job.brief,
      job.word_count as ValidWordCount,
      job.channel_dna
    );

    const newUsage = mergeUsage(job.usage, writeUsage);

    const { error: updateError } = await supabase
      .from("script_jobs")
      .update({
        sections: [script],
        current_section_index: 1,
        previous_tail: null,
        status: "ready",
        usage: newUsage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) throw new Error(`Failed to save script: ${updateError.message}`);

    return { status: "ready", sectionsCompleted: 1, totalSections: 1 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write script";
    const status = (err as { status?: number } | undefined)?.status;
    const isTimeout = status === 408 || /timed out/i.test(message);

    await supabase
      .from("script_jobs")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // Lightweight tracking so we can see whether generation is failing in
    // production, without digging through Trigger.dev logs by hand.
    // Best-effort — a logging failure should never mask the real error.
    supabase
      .from("script_generation_failures")
      .insert({
        job_id: jobId,
        user_id: userId,
        section_index: 0,
        target_words: job.word_count,
        error_message: message,
        is_timeout: isTimeout,
      })
      .then(undefined, () => {});

    throw err instanceof Error ? err : new Error(message);
  }
}

/** Joins the completed sections and saves the finished script to the angle. */
export async function finalizeScriptJob(
  jobId: string,
  userId: string
): Promise<{ script: string; wordCount: number; usage: GenerationUsage; generationId: string }> {
  const supabase = createServiceClient();

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

  // Request the updated row so a write that affects zero rows cannot appear
  // successful when RLS or an incorrect job reference blocks the update.
  const { data: savedAngle, error: saveError } = await supabase
    .from("angles")
    .update({ script: cleanScript, script_generated_at: new Date().toISOString() })
    .eq("id", job.angle_id)
    .select("id")
    .single();

  if (saveError || !savedAngle) {
    throw new Error(`Failed to save script: ${saveError?.message ?? "update affected no rows"}`);
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
  const supabase = createServiceClient();

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

// Generous headroom for a full script in one response — 10,000 words is
// roughly 13,000-15,000 tokens. If your Claude account/model rejects this
// max_tokens value, the API error will state the actual ceiling; lower
// this to match if so.
const SINGLE_CALL_MAX_TOKENS = 20000;

// No Vercel 60s pressure inside a Trigger.dev task — a full 10,000-word
// generation can genuinely take a few minutes. Kept well under Trigger's
// own task budget (3600s, see trigger.config.ts) rather than Vercel's.
const SINGLE_CALL_TIMEOUT_MS = 280_000;

function buildFullScriptPrompt(
  caseData: CaseContext,
  angle: AngleContext,
  brief: ResearchBrief,
  wordCount: ValidWordCount
): string {
  return `Write the COMPLETE narration script for a true crime YouTube video about "${caseData.name}", start to finish, in one continuous piece.

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

CASE FACTS TO DRAW FROM (do not invent facts beyond these):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

STRUCTURED PEOPLE FACTS (use each person's specific outcome and status; do not merge people):
${(brief.peopleFacts ?? []).map((person) => `- ${person.name} | role: ${person.role} | outcome: ${person.outcome} | confession: ${person.confessionStatus ?? "not applicable"} | alive status: ${person.aliveStatus}`).join("\n") || "No structured people facts available."}

SUGGESTED STORY ARC (use this as internal structure — do not label or number sections in the output):
${brief.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}

OPENING HOOK DIRECTION: ${angle.openingHook}

TARGET LENGTH: approximately ${wordCount} words. Write the FULL script now — do not stop partway, do not summarize the rest, do not ask to continue. Finish on a complete sentence, with a proper ending.

Do not write a preamble like "Here is the script." Do not include a title or section headers. Output narration text only.`;
}

async function callClaudeExtended(
  systemBlocks: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[],
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage: RawUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), SINGLE_CALL_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemBlocks,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      const error = new Error(`Claude request timed out after ${SINGLE_CALL_TIMEOUT_MS / 1000}s`) as Error & { status?: number };
      error.status = 408;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const error = new Error(`Claude request failed: ${res.status} ${res.statusText} ${errorBody.slice(0, 500)}`) as Error & { status?: number };
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

function endsCleanly(text: string): boolean {
  return /[.!?]["\)\u201d\u2019]?\s*$/.test(text.trim());
}

interface VerificationIssue {
  claim: string;
  problem: string;
}

function buildVerificationPrompt(script: string, brief: ResearchBrief): string {
  return `You are a fact-checker reviewing a true crime script against a structured research brief before publication.

RESEARCH BRIEF — PEOPLE FACTS (ground truth for this check):
${JSON.stringify(brief.peopleFacts ?? [], null, 2)}

RESEARCH BRIEF — CASE FACTS (ground truth for this check):
${brief.caseFacts.map((fact) => `- ${fact}`).join("\n")}

SCRIPT TO CHECK:
${script}

Compare the script against the brief above. Flag ONLY clear contradictions — places where the script states something that directly conflicts with a specific fact in the brief (e.g. brief says one person was sentenced to death but script implies all were; brief says a person died in a given year but script treats them as alive; brief gives one date for an event but script states a different date for the same event; brief distinguishes who confessed but script says a different or larger group confessed).

Do NOT flag: stylistic choices, omissions of detail the brief also doesn't specify, reasonable narrative framing, or claims the brief doesn't address either way.

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "issues": [{ "claim": string (the specific script statement, quoted or closely paraphrased), "problem": string (what fact it contradicts and what the brief actually says) }]
}

If there are no contradictions, return { "issues": [] }. Return ONLY the JSON object.`;
}

export async function verifyScriptAgainstBrief(
  script: string,
  brief: ResearchBrief
): Promise<VerificationIssue[]> {
  try {
    const { text: raw } = await callClaude(undefined, buildVerificationPrompt(script, brief), 1500);
    const result = parseJsonObject<{ issues: VerificationIssue[] }>(raw);
    return result.issues ?? [];
  } catch {
    return [];
  }
}

/**
 * True single-call generation: research + outline (Tavily + one quick
 * Groq call, same as before) feeds ONE Claude call that writes the
 * entire script at once. If it happens to get cut off near the very end
 * (rare with the token headroom above, but possible), one short
 * continuation call finishes the sentence — not a return to
 * section-by-section chaptering. Meant to be called from inside a
 * Trigger.dev task (see src/trigger/writeScript.ts), not directly from a
 * Vercel API route — SINGLE_CALL_TIMEOUT_MS alone can exceed Vercel's
 * 60s ceiling.
 */
export async function generateScriptSingleCall(
  angleId: string,
  caseId: string,
  wordCount: ValidWordCount,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<{ script: string; usage: GenerationUsage; verificationIssues?: VerificationIssue[] }> {
  const { angle, caseData, channelDNA } = await loadContext(angleId, caseId, userId, supabaseClient);

  const brief = await getOrBuildResearchBrief(angleId, caseId, supabaseClient, true);

  const channelBible = buildChannelBibleBlock(channelDNA);
  const systemBlocks = [
    { type: "text" as const, text: RETENTION_ENGINE, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: channelBible, cache_control: { type: "ephemeral" as const } },
  ];

  const { text: firstPass, usage: firstUsage } = await callClaudeExtended(
    systemBlocks,
    buildFullScriptPrompt(caseData, angle, brief, wordCount),
    SINGLE_CALL_MAX_TOKENS
  );

  let script = firstPass;
  let totalUsage = firstUsage;

  if (!endsCleanly(script)) {
    try {
      const tail = script.split(/\s+/).slice(-60).join(" ");
      const { text: continuation, usage: contUsage } = await callClaudeExtended(
        systemBlocks,
        `The script was cut off mid-sentence. Here is exactly how it ends:\n\n"...${tail}"\n\nWrite ONLY the rest of that final unfinished sentence, plus a proper closing to end the script naturally. Do not repeat anything above. Plain narration text only, no preamble.`,
        500
      );
      script = `${script} ${continuation.trim()}`.trim();
      totalUsage = mergeUsage(totalUsage, contUsage);
    } catch {
      // Non-fatal — ship what we have rather than fail the whole script.
    }
  }

  const verificationIssues = await verifyScriptAgainstBrief(script, brief);

  return { script, usage: toGenerationUsage(totalUsage), verificationIssues };
}

function buildRewritePrompt(
  caseData: CaseContext,
  angle: AngleContext,
  brief: ResearchBrief,
  currentScript: string,
  critique: string
): string {
  return `You are revising an existing true crime YouTube narration script for "${caseData.name}" based on editorial critique.

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}

GROUND-TRUTH RESEARCH — PEOPLE FACTS (the authoritative source for names, outcomes, confession status, alive/deceased status):
${JSON.stringify(brief.peopleFacts ?? [], null, 2)}

GROUND-TRUTH RESEARCH — CASE FACTS:
${brief.caseFacts.map((fact) => `- ${fact}`).join("\n")}

CURRENT SCRIPT:
${currentScript}

EDITORIAL CRITIQUE TO ADDRESS:
${critique}

Rewrite the FULL script addressing the critique above. Important rules:
- Where the critique cites a specific, verifiable correction (a date, a name, a count, an outcome), apply it — but only if it doesn't contradict the GROUND-TRUTH RESEARCH above. If the critique conflicts with the ground-truth research, follow the ground-truth research and do not silently apply the critique's version.
- Where the critique makes a stylistic or structural suggestion, use your judgment on whether it improves the script.
- Do not introduce new claims, dates, or details that aren't supported by either the ground-truth research or the original script.
- Preserve the overall voice, structure, and length of the original unless the critique specifically calls for a structural change.
- Output the complete rewritten script, start to finish, in one continuous piece — no section headers, no bracketed notes, no preamble like "Here is the revised script," no commentary about what you changed. Finish on a complete sentence.`;
}

/** Rewrites a script against its research brief, then runs the same safety check as generation. */
export async function rewriteScriptSingleCall(
  angleId: string,
  caseId: string,
  currentScript: string,
  critique: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<{ script: string; usage: GenerationUsage; verificationIssues?: VerificationIssue[] }> {
  const { angle, caseData, channelDNA } = await loadContext(angleId, caseId, userId, supabaseClient);
  const brief = await getOrBuildResearchBrief(angleId, caseId, supabaseClient);
  const channelBible = buildChannelBibleBlock(channelDNA);
  const systemBlocks = [
    { type: "text" as const, text: RETENTION_ENGINE, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: channelBible, cache_control: { type: "ephemeral" as const } },
  ];

  const { text: firstPass, usage: firstUsage } = await callClaudeExtended(
    systemBlocks,
    buildRewritePrompt(caseData, angle, brief, currentScript, critique),
    SINGLE_CALL_MAX_TOKENS
  );

  let script = firstPass;
  let totalUsage = firstUsage;
  if (!endsCleanly(script)) {
    try {
      const tail = script.split(/\s+/).slice(-60).join(" ");
      const { text: continuation, usage: contUsage } = await callClaudeExtended(
        systemBlocks,
        `The script was cut off mid-sentence. Here is exactly how it ends:\n\n"...${tail}"\n\nWrite ONLY the rest of that final unfinished sentence, plus a proper closing to end the script naturally. Do not repeat anything above. Plain narration text only, no preamble.`,
        500
      );
      script = `${script} ${continuation.trim()}`.trim();
      totalUsage = mergeUsage(totalUsage, contUsage);
    } catch {
      // Non-fatal — ship what we have rather than fail the rewrite.
    }
  }

  const verificationIssues = await verifyScriptAgainstBrief(script, brief);

  return { script, usage: toGenerationUsage(totalUsage), verificationIssues };
}