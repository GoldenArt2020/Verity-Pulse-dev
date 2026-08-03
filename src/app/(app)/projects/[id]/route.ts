import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/projects/[id]
 * Returns a single project row (including its case_id), so the project
 * detail page can resolve which case's intelligence view to render.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Project not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}