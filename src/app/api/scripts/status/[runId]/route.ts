import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runs } from "@trigger.dev/sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  // runId is interpolated into a PostgREST filter below, so restrict it to
  // the Trigger.dev run id charset rather than trusting the path segment.
  if (!/^[A-Za-z0-9_]+$/.test(runId)) {
    return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // RLS (angles_select_own) already restricts this row to the caller, so
  // no application-level ownership check is needed.
  const { data: angle, error: angleError } = await supabase
    .from("angles")
    .select("id, case_id")
    .or(`active_script_run_id.eq.${runId},last_script_run_id.eq.${runId}`)
    .maybeSingle();

  if (angleError) {
    console.error("Ownership check failed:", angleError);
    return NextResponse.json(
      { error: `Failed to verify run ownership: ${angleError.message}` },
      { status: 500 }
    );
  }

  // If no angle currently has this runId as its active run, either it was
  // never valid, or it already completed and got cleared by a prior poll.
  // Either way, we can't verify ownership from this table alone anymore.
  if (!angle) {
    return NextResponse.json({ error: "Run not found or already resolved." }, { status: 404 });
  }

  try {
    const run = await runs.retrieve(runId);

    if (run.status === "COMPLETED") {
      const output = run.output as { script: string; wordCount: number } | undefined;
      await supabase.from("angles").update({ active_script_run_id: null }).eq("active_script_run_id", runId);
      return NextResponse.json({ status: "complete", script: output?.script, wordCount: output?.wordCount });
    }
    if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "TIMED_OUT") {
      await supabase.from("angles").update({ active_script_run_id: null }).eq("active_script_run_id", runId);
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