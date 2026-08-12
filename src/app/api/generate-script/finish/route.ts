import { NextRequest, NextResponse } from "next/server";
import { finalizeScriptJob } from "@/services/scriptWriter";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = body?.jobId as string | undefined;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const result = await finalizeScriptJob(jobId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to finalize script" },
      { status: 500 }
    );
  }
}