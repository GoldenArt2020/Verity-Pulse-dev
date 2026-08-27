import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: angleRow, error: fetchError } = await supabase
    .from("angles")
    .select("script_previous")
    .eq("id", angleId)
    .single();

  if (fetchError || !angleRow?.script_previous) {
    return NextResponse.json({ error: "No previous version to revert to." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("angles")
    .update({
      script: angleRow.script_previous,
      script_previous: null,
      verification_issues: [],
    })
    .eq("id", angleId)
    .select("script")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? "Failed to revert script" }, { status: 500 });
  }

  return NextResponse.json({ script: updated.script });
}
