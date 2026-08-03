import { NextRequest, NextResponse } from "next/server";
import { mediaProvider } from "@/providers/media/mediaProvider";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  if (!mediaProvider.isConfigured()) {
    return NextResponse.json({ url: null });
  }

  try {
    const result = await mediaProvider.search(q, false);
    return NextResponse.json({ url: result?.url ?? null });
  } catch {
    return NextResponse.json({ url: null }, { status: 500 });
  }
}