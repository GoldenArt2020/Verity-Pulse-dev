import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  if (!youtubeProvider.isConfigured()) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  try {
    const channel = await youtubeProvider.resolveHandle(handle);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json({
      channelId: channel.channelId,
      title: channel.title,
      handle: channel.handle,
      description: channel.description,
      thumbnail: channel.thumbnailUrl,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount,
      viewCount: channel.viewCount,
      uploadsPlaylistId: channel.uploadsPlaylistId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve channel";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}