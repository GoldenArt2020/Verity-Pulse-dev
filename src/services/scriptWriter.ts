import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { ChannelDNA } from "@/services/creatorDNA";
import { SCRIPT_WORD_COUNT_OPTIONS, type ScriptWordCount } from "@/constants/scriptOptions";
import { TRUE_CRIME_RETENTION_PRINCIPLES, LONG_SCRIPT_WORD_THRESHOLD } from "@/constants/retentionTechniques";
import { formatSourcesWithReliability } from "@/lib/sourceReliability";

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
  caseFacts: unknown | null;
}

interface ResearchBrief {
  caseFacts: string[];
  ctaGuidance: string;
}

export interface ScriptSeoSummary {
  keywords: string[];
  description: string;
}

export interface GeneratedScriptResult {
  script: string;
  wordCount: number;
  seo: ScriptSeoSummary | null;
}

function buildResearchPrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  caseSourcesText: string
): string {
  const dossierBlock = caseData.caseFacts
    ? `CASE FACTS DOSSIER (the authoritative record for this case — named people, dates, charges, figures, quotes, already verified during research. Treat this as ground truth and draw the majority of your caseFacts output from it):\n${JSON.stringify(caseData.caseFacts, null, 2)}`
    : `No detailed facts dossier is available for this case yet — build caseFacts primarily from the additional sources below.`;

  return `You are a research analyst preparing a briefing for a true crime YouTube scriptwriter. Source material is provided below.

CASE: ${caseData.name}
ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}
SPECIFIC RESEARCH FOCUS FOR THIS ANGLE:
${angle.researchFocus.map((r) => `- ${r}`).join("\n")}

EXISTING CASE SUMMARY:
${caseData.summary ?? "No summary available."}

${dossierBlock}

ADDITIONAL CASE SOURCES (tagged by reliability — use to fill gaps or catch anything more recent than the dossier above; prefer HIGH/MEDIUM sources for anything stated as fact):
${caseSourcesText || "No additional sources found."}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "caseFacts": string[] (8-15 concrete, specific facts about this case relevant to the angle's core question and research focus — named people with roles/ages, exact dates, charges, figures, locations, documented events. Pull these primarily from the facts dossier above; use the additional sources only to add anything the dossier is missing or to update anything more recent. Do not invent anything not supported by the dossier or sources),
  "ctaGuidance": string (2-3 sentences on natural points in a true crime narrative where a subscribe/follow prompt can be woven in without breaking immersion, described as principles, not literal script lines)
}

Return ONLY the JSON object.`;
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

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

/** ~2,600 words/section — fewer, larger sections means fewer sequential
 * Groq round-trips, which matters a lot on Vercel Hobby's 60s hard cap. */
function sectionCountFor(wordCount: ScriptWordCount): number {
  return Math.max(2, Math.ceil(wordCount / 2600));
}

function buildOutlinePrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  brief: ResearchBrief,
  sectionCount: number,
  wordCount: number
): string {
  const longScriptNote =
    wordCount >= LONG_SCRIPT_WORD_THRESHOLD
      ? `\n\nThis is a long-form script (${wordCount.toLocaleString()} words). Mid-script sections carry the highest drop-off risk — make sure the middle sections each contain a genuine new development or reveal, not just connective/background material, so pacing doesn't sag.`
      : "";

  return `You are structuring a ${sectionCount}-part narration script outline for a true crime YouTube video about "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION THE SCRIPT MUST ANSWER: ${angle.coreQuestion}

CASE FACTS AVAILABLE:
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

Structure this as a withholding/reveal arc: tease the resolution or key answer to the core question early, but hold the full answer back until the final section. Each section should end on an open thread rather than a fully resolved beat, so the outline itself builds toward a late payoff instead of resolving evenly across sections.${longScriptNote}

Return ONLY a valid JSON array of exactly ${sectionCount} short strings. Each string is a one-line description of what that section of the narration should cover, in strict order, building toward fully answering the core question only by the final section. Do not number them yourself. Return ONLY the JSON array, nothing else.`;
}

interface SectionPlan {
  index: number;
  focus: string;
  targetWords: number;
  includeCTA: boolean;
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
  previousTail: string | null,
  wordCount: number
): string {
  // channel_dna rows saved before audienceDNA (or channelStyle sub-fields)
  // existed in the schema won't have these keys — fall back per-field
  // instead of crashing, same as lensHistoricalScore below.
  const style = dna?.channelStyle;
  const audience = dna?.audienceDNA;

  const styleLines = style
    ? [
        `- Storytelling style: ${style.storytellingStyle}`,
        `- Pacing: ${style.averagePacing}`,
        `- Emotional tone: ${style.emotionalTone}`,
        style.typicalHooks?.length ? `- Typical hooks this channel uses: ${style.typicalHooks.join(", ")}` : null,
      ].filter(Boolean)
    : [];

  const audienceLines = audience
    ? [
        `- Narrative style (audience-preferred): ${audience.narrativeStyle}`,
        audience.evidenceWeight?.length
          ? `- Evidence emphasis audience responds to: ${audience.evidenceWeight.join(", ")}`
          : null,
        audience.contentFreshness ? `- Content freshness framing: ${audience.contentFreshness}` : null,
      ].filter(Boolean)
    : [];

  const dnaLines = [...styleLines, ...audienceLines];

  const dnaBlock = dnaLines.length > 0
    ? `CHANNEL VOICE TO WRITE IN:\n${dnaLines.join("\n")}`
    : `No Channel DNA profile is available — write in a clear, engaging, emotionally grounded true crime documentary voice.`;

  const isFirst = plan.index === 0;
  const isLast = plan.index === outline.length - 1;

  const continuityBlock = previousTail
    ? `THE NARRATION SO FAR ENDS WITH:\n"...${previousTail}"\n\nContinue DIRECTLY from this point — do not repeat, recap, or restart. Pick up exactly where it left off, same voice, same tense.`
    : `THIS IS THE OPENING of the full script. Open cold — hook the viewer within the first 15-30 seconds of narration, before any scene-setting or preamble. Open with this hook direction, in your own words: ${angle.openingHook}`;

  const ctaBlock = plan.includeCTA
    ? `Include exactly ONE natural, spoken subscribe/follow moment in this section, phrased as a line the narrator would actually say — not labeled, not bracketed. Use this guidance for where/how it fits naturally:\n${brief.ctaGuidance}`
    : `Do not include any subscribe/follow prompt in this section.`;

  const seoBlock = isFirst
    ? `SEO REQUIREMENT FOR THIS OPENING SECTION: within the first two sentences, naturally speak the full case name/subject ("${caseData.name}") and its core searchable category (e.g. missing person case, unsolved murder, cold case — whichever fits) so the transcript matches what viewers actually search for. Never say the words "SEO" or "keywords" out loud.`
    : isLast
    ? `SEO REQUIREMENT FOR THIS FINAL SECTION: close on a sentence that naturally reinforces the case name/subject and core topic in plain spoken language, so the ending of the transcript stays topically relevant for search and suggested placement.`
    : `SEO REQUIREMENT: naturally reuse the case name/subject and closely related search phrases at least once in this section, at a natural spoken cadence — never forced, never listy.`;

  const cliffhangerBlock = !isLast
    ? `This is NOT the final section — end it on an open question, unresolved detail, or rising tension. Do not let this section land on a settled, resolved beat; leave a thread that pulls the viewer into the next section.`
    : `This IS the final section — this is where the withheld resolution/reveal from earlier in the outline should land and the core question gets fully answered.`;

  const longScriptBlock =
    wordCount >= LONG_SCRIPT_WORD_THRESHOLD && !isFirst && !isLast
      ? `This is a long-form script — treat this middle section as high drop-off risk. Make sure it contains a genuine new development or mini-reveal, not just connective or background material.`
      : "";

  return `You are a professional true crime YouTube scriptwriter, mid-way through writing a full narration script about "${caseData.name}".

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

${dnaBlock}

FULL SCRIPT OUTLINE (for your awareness of the whole arc — you are only writing ONE section of it now):
${outline.map((o, i) => `${i + 1}. ${o}${i === plan.index ? "   <-- YOU ARE WRITING THIS SECTION NOW" : ""}`).join("\n")}

CASE FACTS TO DRAW FROM (use these, do not invent facts beyond them — and do not front-load them in a block; spread them through the section as the story naturally reaches them):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

RETENTION TECHNIQUES TO APPLY (structurally, not by naming them out loud):
${TRUE_CRIME_RETENTION_PRINCIPLES.map((r) => `- ${r}`).join("\n")}

${continuityBlock}

${cliffhangerBlock}

${longScriptBlock}

${ctaBlock}

${seoBlock}

WRITE ONLY SECTION ${plan.index + 1} OF ${outline.length} NOW, focused on: "${plan.focus}"
Target length: approximately ${plan.targetWords} words for this section.

Requirements:
- Plain narration text only — no scene headers, no bracketed directions, no "[CUT TO]", no timestamps, no speaker labels, no markdown, no section title.
- Read exactly as a narrator would say it aloud.
- Do not write "in this section" or reference the outline — just write the narration itself.
- Do not include a preamble like "Here is the script" — output narration text only.`;
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

/**
 * Multi-stage script generation for a given angle:
 *   1. Research  — grounded first in the case's saved facts dossier
 *      (case_facts, from the research pass in caseResearch.ts), with a
 *      Tavily-backed search pass layered on top only to fill gaps or catch
 *      anything more recent than the dossier. Every additional source is
 *      tagged HIGH/MEDIUM/LOW reliability so the model knows which claims
 *      to trust for stated fact vs. context only.
 *   2. Outline   — Groq breaks the target word count into N sequential
 *      sections, structured as a withhold/reveal arc (see
 *      TRUE_CRIME_RETENTION_PRINCIPLES) rather than resolving evenly.
 *   3. Sections  — Groq writes each section in order, carrying the tail of
 *      the previous section forward for continuity, with SEO, CTA, and the
 *      fixed retention techniques (cold open, pattern interrupts, spread
 *      facts, cliffhanger endings) applied per-section so long scripts stay
 *      coherent and don't sag in the middle.
 *   4. SEO       — a short Groq pass extracts keywords/description from the
 *      finished script for the creator to reuse when publishing.
 *
 * SERVER-ONLY. Saves the assembled script — plus its word count and SEO
 * summary — to the angles row, so it survives a reload instead of only
 * living in the response payload of this one request.
 */
export async function generateScriptForAngle(
  angleId: string,
  caseId: string,
  channelDNA: ChannelDNA | null,
  wordCount: ScriptWordCount
): Promise<GeneratedScriptResult> {
  if (!(SCRIPT_WORD_COUNT_OPTIONS as readonly number[]).includes(wordCount)) {
    throw new Error(`Invalid word count: ${wordCount}`);
  }
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot research this script");
  }
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot write this script");
  }

  const supabase = await createClient();

  const [{ data: angleRow, error: angleError }, { data: caseRow, error: caseError }] = await Promise.all([
    supabase
      .from("angles")
      .select("id, title, core_question, why_it_works, research_focus, opening_hook")
      .eq("id", angleId)
      .single(),
    supabase.from("cases").select("name, summary, case_facts").eq("id", caseId).single(),
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

  const caseData: CaseForScript = {
    name: caseRow.name,
    summary: caseRow.summary,
    caseFacts: caseRow.case_facts,
  };

  const caseSearchResults = await tavilyProvider.search(
    `${caseRow.name} ${angle.researchFocus.slice(0, 3).join(" ")}`,
    6
  );
  const caseSourcesText = formatSourcesWithReliability(caseSearchResults, 500);

  const researchRaw = await withRetry(() =>
    groqProvider.generateText(buildResearchPrompt(caseData, angle, caseSourcesText), {
      temperature: 0.3,
      maxTokens: 1800,
    })
  );
  const brief = parseJsonObject<ResearchBrief>(researchRaw);

  const sectionCount = sectionCountFor(wordCount);
  const outlineRaw = await withRetry(() =>
    groqProvider.generateText(buildOutlinePrompt(caseData, angle, brief, sectionCount, wordCount), {
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

  const plans = buildSectionPlan(wordCount, outline);
  const sections: string[] = [];
  let previousTail: string | null = null;

  for (const plan of plans) {
    const maxTokens = Math.min(4096, Math.max(600, Math.ceil(plan.targetWords * 1.8)));
    const sectionRaw = await withRetry(() =>
      groqProvider.generateText(
        buildSectionPrompt(caseData, angle, brief, channelDNA, outline, plan, previousTail, wordCount),
        { temperature: 0.65, maxTokens }
      )
    );
    const sectionText = sectionRaw.trim();
    sections.push(sectionText);
    previousTail = sectionText.split(/\s+/).slice(-120).join(" ");
  }

  const cleanScript = sections.join("\n\n").trim();
  const actualWordCount = cleanScript.split(/\s+/).filter(Boolean).length;

  let seo: ScriptSeoSummary | null = null;
  try {
    const seoRaw = await groqProvider.generateText(buildSeoSummaryPrompt(caseData, angle, cleanScript), {
      temperature: 0.3,
      maxTokens: 400,
    });
    seo = parseJsonObject<ScriptSeoSummary>(seoRaw);
  } catch {
    seo = null;
  }

  const { error: saveError } = await supabase
    .from("angles")
    .update({
      script: cleanScript,
      script_generated_at: new Date().toISOString(),
      script_word_count: actualWordCount,
      seo_description: seo?.description ?? null,
      seo_tags: seo?.keywords ?? null,
    })
    .eq("id", angleId);

  if (saveError) {
    throw new Error(`Failed to save script: ${saveError.message}`);
  }

  return { script: cleanScript, wordCount: actualWordCount, seo };
}