import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidWordCount } from "@/services/claudeScriptWriter";
import { checkAndReserveGeneration } from "@/lib/entitlements";
import { tasks } from "@trigger.dev/sdk";
import type { writeScript } from "@/trigger/writeScript";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const angleId = body?.angleId as string | undefined;
  const caseId = body?.caseId as string | undefined;
  const wordCount = body?.wordCount;
  const idempotencyKey = body?.idempotencyKey as string | undefined;

  if (!angleId || !caseId) {
    return NextResponse.json({ error: "angleId and caseId are required" }, { status: 400 });
  }

  const { data: currentAngle } = await supabase
    .from("angles")
    .select("active_script_run_id")
    .eq("id", angleId)
    .maybeSingle();

  if (currentAngle?.active_script_run_id) {
    return NextResponse.json(
      { error: "A generation is already in progress for this angle. Please wait for it to finish." },
      { status: 409 }
    );
  }

  if (!isValidWordCount(wordCount)) {
    return NextResponse.json({ error: "wordCount must be 5000, 7000, or 10000." }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
  }

  const reservation = await checkAndReserveGeneration(user.id, wordCount, idempotencyKey, { angleId, caseId });
  if (!reservation.ok) {
    return NextResponse.json({ error: reservation.reason }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof writeScript>("write-script", {
    angleId,
    caseId,
    wordCount,
    userId: user.id,
    generationId: reservation.generationId!,
  });

  // Persisted so the client can recover and resume polling this exact
  // real run after a connection drop, tab close, or refresh — the run
  // itself keeps going on Trigger's servers regardless.
  //
  // Guarded with .is("script", null): tasks.trigger() is async and this
  // write isn't guaranteed to land before the task itself finishes. If the
  // task races ahead, saves the script, and clears active_script_run_id
  // to null — all before this line executes — the plain .eq(angleId)
  // version would blindly overwrite that null back to handle.id, leaving
  // a completed angle pointing at a "still active" run that's already
  // done. Scoping the update to rows where script is still null makes
  // this a no-op in that case instead of resurrecting a stale run id.
  await supabase
    .from("angles")
    .update({ active_script_run_id: handle.id })
    .eq("id", angleId)
    .is("script", null);

  return NextResponse.json({ runId: handle.id });
}