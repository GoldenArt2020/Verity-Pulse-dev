import { createClient } from "@/lib/supabase/server";
import type { ChannelDNA } from "@/services/creatorDNA";

export interface ScriptJobSourceMaterial {
  caseName: string;
  caseSummary: string | null;
  caseFacts: unknown;
  backgroundProfiles: unknown;
  angleTitle: string;
  coreQuestion: string;
  whyItWorks: string;
  openingHook: string;
  researchFocus: string[];
  curiosityGaps: string[];
  mouthWateringSurprises: string[];
  latestFindings: unknown;
}

export interface ScriptJob {
  id: string;
  user_id: string;
  case_id: string;
  angle_id: string;
  status: "waiting_for_claude" | "claimed" | "completed";
  word_count: number;
  style_note: string | null;
  source_material: ScriptJobSourceMaterial;
  production_bible: ChannelDNA | null;
  script_content: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Bundles everything a script-writing pass needs — case facts dossier,
 * background/daily-life profiles, the selected angle's full detail, and
 * the channel's production bible (Creator DNA) — into one immutable
 * snapshot at prep time. This is deliberately the SAME data shape Phase 2's
 * MCP tools (get_case, get_case_research, get_production_bible) will
 * return, so this isn't throwaway work: the job-staging page and the
 * future MCP tools both read from this one bundling function.
 * SERVER-ONLY.
 */
export async function createScriptJob(
  userId: string,
  caseId: string,
  angleId: string,
  wordCount: number,
  styleNote: string | null
): Promise<ScriptJob> {
  const supabase = await createClient();

  const [{ data: caseRow, error: caseError }, { data: angleRow, error: angleError }] = await Promise.all([
    supabase
      .from("cases")
      .select("name, summary, case_facts, background_profiles")
      .eq("id", caseId)
      .single(),
    supabase
      .from("angles")
      .select(
        "title, core_question, why_it_works, opening_hook, research_focus, curiosity_gaps, mouth_watering_surprises, latest_findings"
      )
      .eq("id", angleId)
      .single(),
  ]);

  if (caseError || !caseRow) throw new Error(`Case not found: ${caseError?.message ?? "unknown error"}`);
  if (angleError || !angleRow) throw new Error(`Angle not found: ${angleError?.message ?? "unknown error"}`);

  let productionBible: ChannelDNA | null = null;
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
    productionBible = (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
  }

  const sourceMaterial: ScriptJobSourceMaterial = {
    caseName: caseRow.name,
    caseSummary: caseRow.summary,
    caseFacts: caseRow.case_facts,
    backgroundProfiles: caseRow.background_profiles,
    angleTitle: angleRow.title,
    coreQuestion: angleRow.core_question,
    whyItWorks: angleRow.why_it_works,
    openingHook: angleRow.opening_hook,
    researchFocus: angleRow.research_focus ?? [],
    curiosityGaps: angleRow.curiosity_gaps ?? [],
    mouthWateringSurprises: angleRow.mouth_watering_surprises ?? [],
    latestFindings: angleRow.latest_findings ?? [],
  };

  const { data: inserted, error: insertError } = await supabase
    .from("claude_handoff_jobs")
    .insert({
      user_id: userId,
      case_id: caseId,
      angle_id: angleId,
      status: "waiting_for_claude",
      word_count: wordCount,
      style_note: styleNote,
      source_material: sourceMaterial,
      production_bible: productionBible,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to create script job: ${insertError?.message ?? "unknown error"}`);
  }

  return inserted as ScriptJob;
}

/**
 * Formats a job's bundled context into one paste-ready prompt block, so
 * this works as a manual stopgap TODAY — copy this into any Claude
 * conversation — and will also be exactly what get_case/get_case_research/
 * get_production_bible return once Phase 2's MCP server exists.
 */
export function formatJobAsPrompt(job: ScriptJob): string {
  const m = job.source_material;
  const bible = job.production_bible;

  return `Write a ${job.word_count}-word true crime documentary narration script.

CASE: ${m.caseName}
${m.caseSummary ?? ""}

ANGLE: ${m.angleTitle}
CORE QUESTION: ${m.coreQuestion}
WHY THIS ANGLE WORKS: ${m.whyItWorks}
OPENING HOOK DIRECTION: ${m.openingHook}

RESEARCH FOCUS:
${m.researchFocus.map((r) => `- ${r}`).join("\n")}

CURIOSITY GAPS TO WEAVE IN:
${m.curiosityGaps.map((c) => `- ${c}`).join("\n")}

MOUTH-WATERING SURPRISES TO TEASE:
${m.mouthWateringSurprises.map((s) => `- ${s}`).join("\n")}

CASE FACTS DOSSIER:
${JSON.stringify(m.caseFacts, null, 2)}

VICTIM/SUSPECT BACKGROUND PROFILES:
${JSON.stringify(m.backgroundProfiles, null, 2)}

${
  bible
    ? `PRODUCTION BIBLE (write in this channel's established voice):
- Storytelling style: ${bible.channelStyle.storytellingStyle}
- Pacing: ${bible.channelStyle.averagePacing}
- Emotional tone: ${bible.channelStyle.emotionalTone}
- Typical hooks: ${bible.channelStyle.typicalHooks.join(", ")}`
    : "No production bible available — write in a clear, engaging, emotionally grounded true crime documentary voice."
}

${job.style_note ? `ADDITIONAL STYLE NOTES: ${job.style_note}` : ""}

Apply strong retention structure: cold open with no preamble, a pattern interrupt (new detail or question) every 60-90 seconds, withhold the core question's answer until the final section, spread facts across the script rather than front-loading them, and end each section (except the last) on a cliffhanger.`;
}