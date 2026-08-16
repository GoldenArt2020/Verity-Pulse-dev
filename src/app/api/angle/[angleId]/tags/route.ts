import { NextRequest, NextResponse } from "next/server";
import { generateTags, saveTags } from "@/services/videoMetadata";

export async function POST(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  try {
    const tags = await generateTags(angleId);
    return NextResponse.json({ tags });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate tags" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  const body = await req.json().catch(() => null);
  const tags = body?.tags;
  if (!Array.isArray(tags)) {
    return NextResponse.json({ error: "tags (string[]) is required" }, { status: 400 });
  }
  try {
    await saveTags(angleId, tags.map((t) => String(t).trim()).filter(Boolean));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save tags" },
      { status: 500 }
    );
  }
}