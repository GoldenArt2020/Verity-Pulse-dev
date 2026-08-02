import { NextRequest, NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";

function parseChannelInput(raw: string): { type: "id" | "handle"; value: string } {
  const trimmed = raw.trim();

  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) {
    return { type: "id", value: channelIdMatch[1] };
  }

  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleUrlMatch) {
    return { type: "handle", value: handleUrlMatch[1] };
  }

  return { type: "handle", value: trimmed.replace(/^@/, "") };
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("handle");

  if (!input) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  if (!youtubeProvider.isConfigured()) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  const parsed = parseChannelInput(input);

  try {
    const item =
      parsed.type === "id"
        ? await youtubeProvider.getChannelSummaryById(parsed.value)
        : await youtubeProvider.resolveHandle(parsed.value);

    if (!item) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json({
      channelId: item.channelId,
      title: item.title,
      description: item.description ?? "",
      thumbnail: item.thumbnailUrl,
      subscriberCount: item.subscriberCount,
      videoCount: item.videoCount,
      viewCount: item.viewCount,
      uploadsPlaylistId: item.uploadsPlaylistId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve handle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}