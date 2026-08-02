import { NextRequest, NextResponse } from "next/server";
import { runCaseResearch } from "@/services/caseResearch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, caseName } = body as { caseId: string; caseName: string };

    if (!caseId || !caseName) {
      return NextResponse.json({ error: "Missing caseId or caseName" }, { status: 400 });
    }

    await runCaseResearch(caseId, caseName);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to research case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}