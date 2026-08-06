import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { ChannelDNA } from "@/services/creatorDNA";

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

Return ONLY the JSON object.`;
}

function buildScriptPrompt(
  caseData: CaseForScript,
  angle: AngleForScript,
  brief: ResearchBrief,
  dna: ChannelDNA | null
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

  return `You are a professional true crime YouTube scriptwriter. Write a complete narration script for a video about "${caseData.name}", built around this angle:

ANGLE: ${angle.title}
CORE QUESTION: ${angle.coreQuestion}
OPENING HOOK DIRECTION: ${angle.openingHook}
WHY THIS ANGLE WORKS: ${angle.whyItWorks}

${dnaBlock}

CASE FACTS TO DRAW FROM (use these, do not invent facts beyond them):
${brief.caseFacts.map((f) => `- ${f}`).join("\n")}

RETENTION TECHNIQUES TO APPLY THROUGHOUT (structurally, not by naming them):
${brief.retentionPrinciples.map((r) => `- ${r}`).join("\n")}

SUBSCRIBE-MOMENT GUIDANCE (weave in exactly 2 natural subscribe/follow prompts, at points that fit this guidance):
${brief.ctaGuidance}

WRITE THE FULL SCRIPT NOW. Requirements:
- Plain narration text only — no scene headers, no bracketed directions, no "[CUT TO]", no timestamps, no speaker labels, no markdown formatting.
- It should read exactly as a narrator would say it aloud, start to finish.
- Open with the hook direction above, in your own words.
- Build the narrative using the case facts and the angle's core question as the throughline.
- Include exactly two subscribe/follow moments, phrased as natural spoken lines the narrator would actually say — not labeled or bracketed, fully blended into the narration.
- Maintain emotional grounding and tension throughout, consistent with the channel voice above.
- End on a line that lands the episode's point, without an artificial "in conclusion" tone.
- Do not include a title, do not include any preamble like "Here is the script" — output the script text and nothing else.`;
}

function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(cleaned);
}

/**
 * Two-stage script generation for a given angle:
 *   1. Research — Tavily search scoped to the angle's research focus
 *      (case facts) plus a separate Tavily search for general true-crime
 *      YouTube retention/craft technique, synthesized by Groq into a
 *      structured brief.
 *   2. Writing — Groq writes the full plain-text narration from that
 *      brief, the angle, and the channel's Creator DNA, with exactly two
 *      subscribe moments woven naturally into the narration.
 *
 * SERVER-ONLY. Saves the result to angles.script / angles.script_generated_at.
 */
export async function generateScriptForAngle(
  angleId: string,
  caseId: string,
  channelDNA: ChannelDNA | null
): Promise<string> {
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

  const [caseSearchResults, craftSearchResults] = await Promise.all([
    tavilyProvider.search(`${caseRow.name} ${angle.researchFocus.slice(0, 3).join(" ")}`, 6),
    tavilyProvider.search("true crime youtube script retention techniques engaging storytelling", 6),
  ]);

  const caseSourcesText = caseSearchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");
  const craftSourcesText = craftSearchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");

  const researchRaw = await groqProvider.generateText(
    buildResearchPrompt(caseRow, angle, caseSourcesText, craftSourcesText),
    { temperature: 0.3, maxTokens: 1400 }
  );
  const brief = parseJSON<ResearchBrief>(researchRaw);

  const script = await groqProvider.generateText(buildScriptPrompt(caseRow, angle, brief, channelDNA), {
    temperature: 0.6,
    maxTokens: 3200,
  });

  const cleanScript = script.trim();

  const { error: saveError } = await supabase
    .from("angles")
    .update({ script: cleanScript, script_generated_at: new Date().toISOString() })
    .eq("id", angleId);

  if (saveError) {
    throw new Error(`Failed to save script: ${saveError.message}`);
  }

  return cleanScript;
}