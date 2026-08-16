import { NextRequest, NextResponse } from "next/server";
import { acquireTranscriptsBatch } from "@/services/videoTranscriptAcquisition";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  try {
    const result = await acquireTranscriptsBatch(caseId, 5);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcript batch failed" },
      { status: 500 }
    );
  }
}