import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string; sourceId: string }> }
) {
  const { sourceId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("video_transcripts")
    .select("cleaned_transcript, raw_transcript, retrieved_via, created_at")
    .eq("source_id", sourceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Transcript not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}