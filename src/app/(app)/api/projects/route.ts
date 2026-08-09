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
    console.error("[api/projects GET] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data ?? []);
}

const VALID_STATUSES = [
  "IDEA", "RESEARCH", "NARRATIVE", "SEO", "THUMBNAIL",
  "RECORDING", "EDITING", "SCHEDULED", "PUBLISHED", "ARCHIVED",
];

export async function POST(req: NextRequest) {
  try {
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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[api/projects POST] Auth error:", authError);
      return NextResponse.json({ error: "Auth check failed: " + authError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("projects")
      .select(
        "id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)"
      )
      .eq("case_id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error("[api/projects POST] Error checking for existing project:", existingError);
      return NextResponse.json({ error: "Could not check for existing project: " + existingError.message }, { status: 400 });
    }

    if (existing) {
      return NextResponse.json(existing);
    }

    const { data: insertedId, error: insertError } = await supabase
      .from("projects")
      .insert({ case_id: caseId, status, user_id: user.id })
      .select("id")
      .single();

    if (insertError) {
      console.error("[api/projects POST] Insert failed:", insertError);
      return NextResponse.json({ error: "Failed to create project: " + insertError.message }, { status: 400 });
    }

    if (!insertedId?.id) {
      console.error("[api/projects POST] Insert returned no id, no error either — unexpected empty result.");
      return NextResponse.json({ error: "Project was created but no id was returned." }, { status: 500 });
    }

    const { data: fullProject, error: readBackError } = await supabase
      .from("projects")
      .select(
        "id, status, created_at, case_id, cases(name, category, country, summary, opportunity_score, competition_score)"
      )
      .eq("id", insertedId.id)
      .single();

    if (readBackError || !fullProject) {
      console.error("[api/projects POST] Insert succeeded but read-back failed:", readBackError);
      return NextResponse.json({ id: insertedId.id, status, case_id: caseId });
    }

    return NextResponse.json(fullProject);
  } catch (err) {
    console.error("[api/projects POST] Unexpected exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}