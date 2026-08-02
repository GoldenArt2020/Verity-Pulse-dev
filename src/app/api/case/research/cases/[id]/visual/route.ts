import { NextRequest, NextResponse } from "next/server";
import { getOrFetchCaseVisual } from "@/services/caseVisuals";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = req.nextUrl.searchParams.get("category") ?? "general";
  const allowVideo = req.nextUrl.searchParams.get("allowVideo") === "true";

  try {
    const visual = await getOrFetchCaseVisual(id, category, allowVideo);
    if (!visual) {
      return NextResponse.json({ error: "No media found" }, { status: 404 });
    }
    return NextResponse.json(visual);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch case visual";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}