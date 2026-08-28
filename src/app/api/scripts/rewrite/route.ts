import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndReserveGeneration } from "@/lib/entitlements";
import { tasks } from "@trigger.dev/sdk";
import type { rewriteScript } from "@/trigger/rewriteScript";

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
  const critique = body?.critique as string | undefined;
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

  if (!critique || !critique.trim()) {
    return NextResponse.json({ error: "critique is required" }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
  }

  const { data: angleRow } = await supabase
    .from("angles")
    .select("script_word_count")
    .eq("id", angleId)
    .single();
  const nominalWordCount = (angleRow?.script_word_count ?? 5000) as 5000 | 7000 | 10000;

  const reservation = await checkAndReserveGeneration(user.id, nominalWordCount, idempotencyKey, {
    angleId,
    caseId,
  });
  if (!reservation.ok) {
    return NextResponse.json({ error: reservation.reason }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof rewriteScript>("rewrite-script", {
    angleId,
    caseId,
    critique,
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
