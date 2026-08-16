import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCrossSourceComparison } from "@/services/crossSourceComparison";
import { getResearchSummary } from "@/services/researchSummary";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const result = await getResearchSummary(caseId);
  return NextResponse.json(result);
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