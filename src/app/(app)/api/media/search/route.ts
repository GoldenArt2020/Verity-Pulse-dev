import { NextRequest, NextResponse } from "next/server";
import { mediaProvider } from "@/providers/media/mediaProvider";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  if (!mediaProvider.isConfigured()) {
    return NextResponse.json({ url: null });
  }
  try {
    const result = await mediaProvider.search(query, false);
    return NextResponse.json(result ?? { url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}