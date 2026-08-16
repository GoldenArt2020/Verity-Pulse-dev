import { NextRequest, NextResponse } from "next/server";
import { findActiveScriptJob } from "@/services/scriptWriter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const angleId = req.nextUrl.searchParams.get("angleId");

  if (!angleId) {
    return NextResponse.json({ error: "angleId is required" }, { status: 400 });
  }

  try {
    const job = await findActiveScriptJob(angleId);
    return NextResponse.json({ job });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check for an active script job" },
      { status: 500 }
    );
  }
}