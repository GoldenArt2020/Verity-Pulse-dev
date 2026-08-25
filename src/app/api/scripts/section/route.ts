import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceScriptJob } from "@/services/claudeScriptWriter";
import { failGeneration } from "@/lib/entitlements";

// One Claude call per request — the whole reason this is split out.
// Keeps every request well under the 60s ceiling regardless of total
// script length, and means a timeout can never happen mid-token-stream.
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
  const jobId = body?.jobId as string | undefined;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const result = await advanceScriptJob(jobId, user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/scripts/section] failed:", err);

    // Refund whatever credit this job's reservation took.
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
      { error: "Script generation failed. Your credit has been refunded — please try again." },
      { status: 502 }
    );
  }
}