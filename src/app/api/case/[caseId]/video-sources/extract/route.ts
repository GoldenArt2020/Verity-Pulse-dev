import { NextRequest, NextResponse } from "next/server";
import { extractResearchBatch } from "@/services/videoResearchExtraction";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
    const result = await extractResearchBatch(caseId, caseName, 5);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction batch failed" },
      { status: 500 }
    );
  }
}