import { NextRequest, NextResponse } from "next/server";
import { isValidScriptWordCount } from "@/constants/scriptOptions";
import { createScriptJob } from "@/services/scriptWriter";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const angleId = body?.angleId as string | undefined;
  const caseId = body?.caseId as string | undefined;
  const wordCount = body?.wordCount;

  if (!angleId || !caseId) {
    return NextResponse.json({ error: "angleId and caseId are required" }, { status: 400 });
  }
  if (!isValidScriptWordCount(wordCount)) {
    return NextResponse.json({ error: "Invalid wordCount" }, { status: 400 });
  }

  try {
    const { jobId, totalSections } = await createScriptJob(angleId, caseId, wordCount);
    return NextResponse.json({ jobId, totalSections });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start script generation" },
      { status: 500 }
    );
  }
}