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

  // Ownership check FIRST, before we ever look at the Trigger.dev run itself.
  // Adjust the join below to match your schema — this assumes `angles.case_id`
  // -> `cases.user_id`. If angles/cases don't carry user_id directly, join
  // through whatever table does (e.g. a `projects` or `workspaces` table).
  const { data: angle, error: angleError } = await supabase
    .from("angles")
    .select("id, case_id, cases!inner(user_id)")
    .eq("active_script_run_id", runId)
    .maybeSingle();

  if (angleError) {
    return NextResponse.json({ error: "Failed to verify run ownership." }, { status: 500 });
  }

  // If no angle currently has this runId as its active run, either it was
  // never valid, or it already completed and got cleared by a prior poll.
  // Either way, we can't verify ownership from this table alone anymore.
  if (!angle) {
    return NextResponse.json({ error: "Run not found or already resolved." }, { status: 404 });
  }

  // @ts-expect-error - Supabase's generated types don't infer the joined shape here
  const ownerId = angle.cases?.user_id;
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Not authorized to view this run." }, { status: 403 });
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