import { NextRequest, NextResponse } from "next/server";
import { advanceScriptJob } from "@/services/scriptWriter";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = body?.jobId as string | undefined;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const result = await advanceScriptJob(jobId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write next section" },
      { status: 500 }
    );
  }
}