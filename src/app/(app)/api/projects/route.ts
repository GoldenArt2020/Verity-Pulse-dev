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
    .select(
      "id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data ?? []);
}

const VALID_STATUSES = [
  "IDEA", "RESEARCH", "NARRATIVE", "SEO", "THUMBNAIL",
  "RECORDING", "EDITING", "SCHEDULED", "PUBLISHED", "ARCHIVED",
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  const status = (body?.status as string | undefined) ?? "IDEA";

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("case_id", caseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ case_id: caseId, status, user_id: user.id })
    .select(
      "id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}