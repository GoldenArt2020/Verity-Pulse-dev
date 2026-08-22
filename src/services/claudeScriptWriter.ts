import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import type { ChannelDNA } from "@/services/creatorDNA";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = process.env.ANTHROPIC_SCRIPT_MODEL ?? "claude-sonnet-5";

// Rough word-to-token ratio for English narration prose (~1.4), plus
// headroom so Claude never gets truncated mid-sentence chasing the exact
// word count. This is NOT "10,000 words = 10,000 tokens" — deliberately
// avoiding that mistake per the spec.
const WORD_COUNT_TOKEN_BUDGET: Record<number, number> = {
  5000: 8000,
  7000: 11000,
  10000: 15000,
};

export const VALID_WORD_COUNTS = [5000, 7000, 10000] as const;
export type ValidWordCount = (typeof VALID_WORD_COUNTS)[number];

export function isValidWordCount(value: unknown): value is ValidWordCount {
  return typeof value === "number" && (VALID_WORD_COUNTS as readonly number[]).includes(value);
}

// Anthropic's list pricing as of this writing (Sonnet 5, before the
// Aug 31 2026 price change to $3/$15). Configurable via env so pricing
// updates don't require a code change.
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

export interface GenerationUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  estimatedCostUsd: number;
}

export interface ScriptGenerationResult {
  script: string;
  usage: GenerationUsage;
  durationMs: number;
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

LENGTH DISCIPLINE: never pad to hit a word count. A shorter script should be tight and fast-moving with only the strongest evidence. A longer script should use the extra room for genuine additional depth — more evidence developments, competing theories, richer investigation progression — never filler.`;

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

function lengthGuidance(wordCount: ValidWordCount): string {
  if (wordCount === 5000) {
    return "TARGET: ~5,000 words. Tight and fast-moving. Use only the strongest evidence. Minimal side context.";
  }
  if (wordCount === 7000) {
    return "TARGET: ~7,000 words. Deeper investigation than the short form — more context, a fuller evidence progression, more room for the people involved.";
  }
  return "TARGET: ~10,000 words. Genuinely deep investigation — multiple evidence developments, competing theories where the research supports them, detailed investigation progression, courtroom/evidence context where relevant, strong recontextualization, a satisfying ending.";
}

/**
 * Builds the compact, non-cached dynamic instruction — case facts, angle,
 * research, and length. Deliberately excludes anything not needed to
 * write THIS script: no other cases, no other channels' data, no old
 * scripts, no UI/auth/subscription state.
 */
function buildDynamicPrompt(
  caseData: CaseContext,
  angle: AngleContext,
  wordCount: ValidWordCount,
  researchText: string
): string {
  return `Write a complete narration script for a true crime YouTube video.

CASE: ${caseData.name}
${caseData.summary ? `CASE SUMMARY: ${caseData.summary}` : ""}

ANGLE: ${angle.title}
CORE QUESTION THIS SCRIPT MUST ANSWER: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}
RESEARCH FOCUS: ${angle.researchFocus.join("; ")}
OPENING HOOK DIRECTION: ${angle.openingHook}

RESEARCH / SOURCE MATERIAL (use only what's supported here — do not invent beyond it):
${researchText}

${lengthGuidance(wordCount)}

Write the complete script now, start to finish, in one continuous piece. Do not include a title, headers, or any preamble — output the narration text only.`;
}

async function loadContext(
  angleId: string,
  caseId: string
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
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

function estimateCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  const input = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_M;
  const output = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_M;
  const cacheWrite = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * CACHE_WRITE_COST_PER_M;
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * CACHE_READ_COST_PER_M;
  return input + output + cacheWrite + cacheRead;
}

/**
 * ONE Claude generation call per script. System prompt is split into two
 * cached blocks (the global retention engine — identical for every user
 * — and the channel-specific bible — identical across all of one
 * channel's scripts) so repeated generations for the same channel only
 * pay full input cost once per ~5-minute cache window; subsequent calls
 * within that window hit the cache at a fraction of the cost. The
 * dynamic case/angle/research context goes in the user message, never
 * cached, since it's unique per script.
 */
export async function generateScript(
  angleId: string,
  caseId: string,
  wordCount: ValidWordCount
): Promise<ScriptGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const { angle, caseData, channelDNA } = await loadContext(angleId, caseId);

  // Compact research — real search results, not the entire database.
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

  const channelBible = buildChannelBibleBlock(channelDNA);
  const dynamicPrompt = buildDynamicPrompt(caseData, angle, wordCount, researchText);
  const maxTokens = WORD_COUNT_TOKEN_BUDGET[wordCount];

  const startedAt = Date.now();

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
      temperature: 0.7,
      system: [
        // Cached, identical for every user/script — best caching payoff.
        { type: "text", text: RETENTION_ENGINE, cache_control: { type: "ephemeral" } },
        // Cached, identical across this channel's scripts within the
        // cache window — still a real saving for a creator writing
        // several scripts in one session.
        { type: "text", text: channelBible, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: dynamicPrompt }],
    }),
  });

  const durationMs = Date.now() - startedAt;

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const error = new Error(`Claude request failed: ${res.status} ${res.statusText} ${errorBody.slice(0, 300)}`) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const script = (data.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("")
    .trim();

  if (!script) {
    throw new Error("Claude returned an empty script");
  }

  const usage: GenerationUsage = {
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    cacheCreationInputTokens: data.usage?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: data.usage?.cache_read_input_tokens ?? 0,
    estimatedCostUsd: estimateCost(data.usage ?? {}),
  };

  console.log(
    `[claudeScriptWriter] ${wordCount}-word script — input: ${usage.inputTokens}, output: ${usage.outputTokens}, cache_read: ${usage.cacheReadInputTokens}, cache_write: ${usage.cacheCreationInputTokens}, est. cost: $${usage.estimatedCostUsd.toFixed(4)}, duration: ${durationMs}ms`
  );

  return { script, usage, durationMs };
}