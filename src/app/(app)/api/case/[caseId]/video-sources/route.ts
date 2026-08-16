import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { discoverVideoSources } from "@/services/videoSourceDiscovery";

// Discovery fans out across ~9-13 YouTube searches — comfortably fast
// (search-only, no transcript work here), but still worth an explicit
// budget rather than trusting the platform default.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("video_sources")
    .select(
      "id, youtube_video_id, youtube_url, video_title, channel_name, channel_id, publication_date, video_description, source_category, relevance_score, matched_queries, duplicate_of, transcript_status, transcript_language, retrieval_date, created_at"
    )
    .eq("case_id", caseId)
    .order("relevance_score", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const body = await req.json().catch(() => null);
  const caseName = body?.caseName as string | undefined;

  if (!caseName) {
    return NextResponse.json({ error: "caseName is required" }, { status: 400 });
  }

  try {
    const count = await discoverVideoSources(caseId, caseName);
    return NextResponse.json({ discovered: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery failed" },
      { status: 500 }
    );
  }
}