import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube";

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  if (!youtubeProvider.isConfigured()) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  try {
    const stats = await youtubeProvider.getChannelStats(channelId);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch channel stats";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}