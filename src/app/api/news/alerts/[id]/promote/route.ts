// src/app/api/news/alerts/[id]/promote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Leave summary null so the case follows the same "stub" research flow the
  // angle-builder page already handles for any freshly created case.
  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert({ name: alert.case_name || alert.headline, summary: null })
    .select("id")
    .single();

  if (caseError || !newCase) {
    return NextResponse.json(
      { error: `Failed to create case: ${caseError?.message}` },
      { status: 500 }
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