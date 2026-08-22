import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createScriptJob } from "@/services/scriptJobs";
import { isValidScriptWordCount } from "@/constants/scriptOptions";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { caseId, angleId, wordCount, styleNote } = body ?? {};

  if (!caseId || !angleId || !isValidScriptWordCount(wordCount)) {
    return NextResponse.json({ error: "caseId, angleId, and wordCount (5000, 7000, or 10000) are required" }, { status: 400 });
  }

  try {
    const job = await createScriptJob(user.id, caseId, angleId, wordCount, styleNote ?? null);
    return NextResponse.json({ job });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create job" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("claude_handoff_jobs")
    .select("id, case_id, angle_id, status, word_count, created_at, source_material")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}