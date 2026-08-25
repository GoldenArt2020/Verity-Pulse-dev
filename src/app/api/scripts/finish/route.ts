import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeScriptJob } from "@/services/claudeScriptWriter";
import { completeGeneration, failGeneration } from "@/lib/entitlements";

// Joins already-written sections and saves — no Claude call here, so this
// is fast and comfortably under the 60s ceiling regardless of script length.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const jobId = body?.jobId as string | undefined;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const result = await finalizeScriptJob(jobId, user.id);

    await completeGeneration(result.generationId, {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheCreationInputTokens: result.usage.cacheCreationInputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
      durationMs: Date.now() - startedAt,
      estimatedCostUsd: result.usage.estimatedCostUsd,
    });

    return NextResponse.json({ script: result.script, wordCount: result.wordCount });
  } catch (err) {
    console.error("[/api/scripts/finish] failed:", err);

    const { data: job } = await supabase
      .from("script_jobs")
      .select("generation_id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (job?.generation_id) {
      await failGeneration(job.generation_id, user.id, err instanceof Error ? err.message : "Unknown error");
    }

    return NextResponse.json(
      { error: "Couldn't finish the script. Your credit has been refunded — please try again." },
      { status: 502 }
    );
  }
}