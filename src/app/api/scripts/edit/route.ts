import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndReserveGeneration } from "@/lib/entitlements";
import { tasks } from "@trigger.dev/sdk";
import type { editScript } from "@/trigger/editScript";

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
  const edits = body?.edits as { find: string; instruction: string }[] | undefined;
  const idempotencyKey = body?.idempotencyKey as string | undefined;

  if (!angleId || !caseId) {
    return NextResponse.json({ error: "angleId and caseId are required" }, { status: 400 });
  }
  if (!edits || !Array.isArray(edits) || edits.length === 0) {
    return NextResponse.json({ error: "At least one edit is required" }, { status: 400 });
  }
  if (edits.some((edit) => !edit.find?.trim() || !edit.instruction?.trim())) {
    return NextResponse.json({ error: "Each edit needs both find text and an instruction" }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
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

  const reservation = await checkAndReserveGeneration(user.id, 1000, idempotencyKey, { angleId, caseId });
  if (!reservation.ok) {
    return NextResponse.json({ error: reservation.reason }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof editScript>("edit-script", {
    angleId,
    edits,
    userId: user.id,
    generationId: reservation.generationId!,
  });

  await supabase
    .from("angles")
    .update({ active_script_run_id: handle.id })
    .eq("id", angleId)
    .is("active_script_run_id", null);

  return NextResponse.json({ runId: handle.id });
}
