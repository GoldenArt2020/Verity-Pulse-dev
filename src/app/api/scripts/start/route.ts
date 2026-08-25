import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startScriptJob, isValidWordCount } from "@/services/claudeScriptWriter";
import { checkAndReserveGeneration, failGeneration } from "@/lib/entitlements";

// Research + outline only — one Claude call, comfortably under 60s.
export const maxDuration = 60;
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
  if (!isValidWordCount(wordCount)) {
    return NextResponse.json({ error: "wordCount must be 5000, 7000, or 10000." }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
  }

  const { data: angle } = await supabase
    .from("angles")
    .select("id")
    .eq("id", angleId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!angle) {
    return NextResponse.json({ error: "Angle does not belong to the requested case." }, { status: 404 });
  }

  const reservation = await checkAndReserveGeneration(user.id, wordCount, idempotencyKey, { angleId, caseId });
  if (!reservation.ok) {
    const isDuplicate = reservation.reason?.startsWith("This generation ") ?? false;
    return NextResponse.json({ error: reservation.reason }, { status: isDuplicate ? 409 : 403 });
  }

  const generationId = reservation.generationId!;

  try {
    const { jobId, totalSections } = await startScriptJob(angleId, caseId, user.id, wordCount, generationId);
    return NextResponse.json({ jobId, totalSections });
  } catch (err) {
    console.error("[/api/scripts/start] failed:", err);
    await failGeneration(generationId, user.id, err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Couldn't start script generation. Your credit has been refunded — please try again." },
      { status: 502 }
    );
  }
}