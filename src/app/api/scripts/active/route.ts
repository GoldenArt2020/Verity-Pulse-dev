import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findActiveScriptJob } from "@/services/claudeScriptWriter";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const angleId = req.nextUrl.searchParams.get("angleId");
  if (!angleId) {
    return NextResponse.json({ error: "angleId is required" }, { status: 400 });
  }

  const job = await findActiveScriptJob(angleId, user.id);
  return NextResponse.json({ job });
}