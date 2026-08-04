import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrBuildCoverageIntelligence } from "@/services/coverageAnalysis";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

  const supabase = await createClient();
  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("name, summary, youtube_titles, coverage_intelligence")
    .eq("id", caseId)
    .single();

  if (error || !caseRow) {
    return NextResponse.json({ error: error?.message ?? "Case not found" }, { status: 404 });
  }
  if (!caseRow.summary) {
    return NextResponse.json({ error: "Case has not been researched yet" }, { status: 400 });
  }

  try {
    const result = await getOrBuildCoverageIntelligence(
      caseId,
      caseRow.name,
      caseRow.summary,
      (caseRow.youtube_titles as string[] | null) ?? [],
      (caseRow.coverage_intelligence as any) ?? null
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze coverage" },
      { status: 500 }
    );
  }
}