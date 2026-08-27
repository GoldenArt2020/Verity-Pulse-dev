import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTitleIdeas } from "@/lib/titleIdeas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("angles")
    .select(
      "id, title, core_question, why_it_works, research_focus, opening_hook, scores, script, script_previous, script_generated_at, script_word_count, active_script_run_id, verification_issues, seo_description, seo_tags, case_writeup, channel_fit, why_work_on_it, curiosity_gaps, latest_findings, title_ideas"
    )
    .eq("case_id", caseId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const angles = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    coreQuestion: row.core_question,
    whyItWorks: row.why_it_works,
    researchFocus: row.research_focus,
    openingHook: row.opening_hook,
    scores: row.scores,
    script: row.script,
    scriptPrevious: row.script_previous,
    scriptGeneratedAt: row.script_generated_at,
    scriptWordCount: row.script_word_count,
    activeScriptRunId: row.active_script_run_id ?? null,
    verificationIssues: row.verification_issues,
    seo:
      row.seo_description || row.seo_tags
        ? { description: row.seo_description, tags: row.seo_tags ?? [] }
        : null,
    caseWriteup: row.case_writeup ?? "",
    channelFit: row.channel_fit ?? "",
    whyWorkOnIt: row.why_work_on_it ?? "",
    curiosityGaps: row.curiosity_gaps ?? [],
    latestFindings: row.latest_findings ?? [],
    titleIdeas: normalizeTitleIdeas(row.title_ideas),
  }));

  return NextResponse.json({ angles });
}