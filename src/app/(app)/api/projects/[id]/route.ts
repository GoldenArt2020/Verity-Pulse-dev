import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  // Prevent duplicate projects for the same user + case
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .eq("case_id", caseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, case_id: caseId, status: "active" })
    .select("id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create project" }, { status: 400 });
  }
  return NextResponse.json(data);
}