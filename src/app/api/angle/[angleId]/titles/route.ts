import { NextRequest, NextResponse } from "next/server";
import { generateTitleSuggestions } from "@/services/videoMetadata";

export async function POST(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  try {
    const titles = await generateTitleSuggestions(angleId);
    return NextResponse.json({ titles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate titles" },
      { status: 500 }
    );
  }
}