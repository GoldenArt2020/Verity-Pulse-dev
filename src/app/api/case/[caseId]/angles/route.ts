import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("angles")
    .select(
      "id, title, core_question, why_it_works, research_focus, opening_hook, scores, script, script_generated_at, script_word_count, seo_title, seo_description, seo_tags"
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
    scriptGeneratedAt: row.script_generated_at,
    scriptWordCount: row.script_word_count,
    seo:
      row.seo_title || row.seo_description || row.seo_tags
        ? { title: row.seo_title, description: row.seo_description, tags: row.seo_tags ?? [] }
        : null,
  }));

  return NextResponse.json({ angles });
}