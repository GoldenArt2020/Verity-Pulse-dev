import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateScript, isValidWordCount } from "@/services/claudeScriptWriter";
import { checkAndReserveGeneration, completeGeneration, failGeneration } from "@/lib/entitlements";

// 60s is Vercel Hobby's hard cap. A single 10,000-word Claude call can
// realistically approach or exceed this — if you see this route timing
// out specifically on the 10,000-word tier, that's the signal to
// upgrade to Vercel Pro (300s) rather than a code fix.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Authenticate — server-verified session, never trust anything the
  //    client claims about who it is.
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
  // 2. Validate word count SERVER-SIDE — never trust the browser's value.
  if (!isValidWordCount(wordCount)) {
    return NextResponse.json({ error: "wordCount must be 5000, 7000, or 10000." }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey is required" }, { status: 400 });
  }

  // 3. Check entitlement + atomically reserve one credit BEFORE calling
  //    Claude — an unpaid or over-quota user must never be able to
  //    consume API balance, even by hitting this route directly.
  const reservation = await checkAndReserveGeneration(user.id, wordCount, idempotencyKey, { angleId, caseId });
  if (!reservation.ok) {
    return NextResponse.json({ error: reservation.reason }, { status: 403 });
  }

  const generationId = reservation.generationId!;

  try {
    const { script, usage, durationMs } = await generateScript(angleId, caseId, wordCount);

    // Save the script the same way the existing UI already expects it.
    const { error: saveError } = await supabase
      .from("angles")
      .update({ script, script_generated_at: new Date().toISOString() })
      .eq("id", angleId);

    if (saveError) {
      throw new Error(`Failed to save script: ${saveError.message}`);
    }

    await completeGeneration(generationId, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheCreationInputTokens: usage.cacheCreationInputTokens,
      cacheReadInputTokens: usage.cacheReadInputTokens,
      durationMs,
      estimatedCostUsd: usage.estimatedCostUsd,
    });

    const wordCountActual = script.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({ script, wordCount: wordCountActual, usage });
  } catch (err) {
    // Log the real error server-side; never expose raw API errors or
    // keys to the client.
    console.error("[/api/scripts/generate] generation failed:", err);
    await failGeneration(generationId, user.id, err instanceof Error ? err.message : "Unknown error");

    return NextResponse.json(
      { error: "Script generation failed. Your credit has been refunded — please try again." },
      { status: 502 }
    );
  }
}