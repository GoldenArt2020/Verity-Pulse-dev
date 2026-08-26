import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runs } from "@trigger.dev/sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const run = await runs.retrieve(runId);

    if (run.status === "COMPLETED") {
      const output = run.output as { script: string; wordCount: number } | undefined;
      return NextResponse.json({ status: "complete", script: output?.script, wordCount: output?.wordCount });
    }
    if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "TIMED_OUT") {
      return NextResponse.json({ status: "failed", error: run.error?.message ?? "Script generation failed" });
    }
    return NextResponse.json({ status: "in_progress" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check generation status" },
      { status: 500 }
    );
  }
}