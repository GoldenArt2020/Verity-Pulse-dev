import { NextRequest, NextResponse } from "next/server";
import { generateDescription, saveDescription } from "@/services/videoMetadata";

export async function POST(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  try {
    const description = await generateDescription(angleId);
    return NextResponse.json({ description });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate description" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  const body = await req.json().catch(() => null);
  const description = body?.description;
  if (typeof description !== "string") {
    return NextResponse.json({ error: "description (string) is required" }, { status: 400 });
  }
  try {
    await saveDescription(angleId, description);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save description" },
      { status: 500 }
    );
  }
}