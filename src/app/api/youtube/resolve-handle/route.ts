import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  if (!youtubeProvider.isConfigured()) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  try {
    const clean = handle.replace(/^@/, "");
    const apiKey = process.env.YOUTUBE_API_KEY;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${clean}&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`YouTube request failed: ${res.status}`);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    return NextResponse.json({
      channelId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.default?.url,
      subscriberCount: item.statistics.subscriberCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve handle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}