// src/app/api/news/alerts/[id]/promote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCaseServer } from "@/services/getOrCreateCase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: alert, error: alertError } = await supabase
    .from("case_alerts")
    .select("id, headline, case_name, status")
    .eq("id", id)
    .single();

  if (alertError || !alert) {
    return NextResponse.json({ error: alertError?.message ?? "Alert not found" }, { status: 404 });
  }

  if (alert.status === "promoted") {
    return NextResponse.json({ error: "This alert has already been promoted" }, { status: 400 });
  }

  // Now reuses the same name-validation + case-insensitive dedup logic
  // the rest of the app relies on, instead of a raw insert that could
  // create duplicate cases for the same story under a slightly different
  // headline, or create an unresearchable case from a too-vague name.
  let newCase;
  try {
    newCase = await getOrCreateCaseServer(supabase, alert.case_name || alert.headline);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create case" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("case_alerts")
    .update({ status: "promoted", matched_case_id: newCase.id })
    .eq("id", id)
    .eq("status", "pending");

  if (updateError) {
    return NextResponse.json(
      { error: `Case created but failed to update alert: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ caseId: newCase.id });
}