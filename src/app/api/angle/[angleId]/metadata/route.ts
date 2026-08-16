import { NextRequest, NextResponse } from "next/server";
import { getAngleMetadata } from "@/services/videoMetadata";

export async function GET(req: NextRequest, { params }: { params: Promise<{ angleId: string }> }) {
  const { angleId } = await params;
  try {
    const metadata = await getAngleMetadata(angleId);
    return NextResponse.json(metadata);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load angle metadata" },
      { status: 500 }
    );
  }
}