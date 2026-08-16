import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCrossSourceComparison } from "@/services/crossSourceComparison";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const supabase = await createClient();

  const [{ data: extractions }, { data: comparisons }] = await Promise.all([
    supabase
      .from("video_source_extractions")
      .select("people, locations, dates, claims, quotations, leads, video_sources!inner(case_id)")
      .eq("video_sources.case_id", caseId),
    supabase.from("case_claim_comparisons").select("id, claim_summary, status, citations").eq("case_id", caseId),
  ]);

  const rows = extractions ?? [];
  const uniquePeople = new Set<string>();
  let eventCount = 0;
  let leadCount = 0;
  for (const r of rows as any[]) {
    for (const p of r.people ?? []) uniquePeople.add(p.name);
    eventCount += (r.dates ?? []).length;
    leadCount += (r.leads ?? []).length;
  }

  const comparisonRows = comparisons ?? [];
  const summary = {
    sourcesAnalyzed: rows.length,
    peopleIdentified: uniquePeople.size,
    importantEvents: eventCount,
    potentialLeads: leadCount,
    confirmedClaims: comparisonRows.filter((c) => c.status === "CONFIRMED").length,
    conflictingClaims: comparisonRows.filter((c) => c.status === "CONFLICTING").length,
    unverifiedClaims: comparisonRows.filter((c) => c.status === "UNVERIFIED").length,
    singleSourceClaims: comparisonRows.filter((c) => c.status === "SINGLE_SOURCE").length,
  };

  return NextResponse.json({ summary, comparisons: comparisonRows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const body = await req.json().catch(() => null);
  const caseName = body?.caseName as string | undefined;
  if (!caseName) {
    return NextResponse.json({ error: "caseName is required" }, { status: 400 });
  }

  try {
    const count = await runCrossSourceComparison(caseId, caseName);
    return NextResponse.json({ claimsCompared: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Comparison failed" },
      { status: 500 }
    );
  }
}