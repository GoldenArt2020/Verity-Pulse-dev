import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrBuildResearchBrief } from "@/services/claudeScriptWriter";

export async function POST(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

  try {
    await getOrBuildResearchBrief(angleId, caseId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-critical — a failed prewarm just means Write Script falls back
    // to doing research inline later, same as before this feature existed.
    console.warn("[prewarm-research] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false });
  }
}
