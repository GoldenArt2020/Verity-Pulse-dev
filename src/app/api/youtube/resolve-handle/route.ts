import { NextRequest, NextResponse } from "next/server";

function parseChannelInput(raw: string): { type: "id" | "handle"; value: string } {
  const trimmed = raw.trim();

  // Full URL: https://www.youtube.com/channel/UCxxxxxxxx
  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) {
    return { type: "id", value: channelIdMatch[1] };
  }

  // Full URL: https://www.youtube.com/@handle
  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleUrlMatch) {
    return { type: "handle", value: handleUrlMatch[1] };
  }

  // Plain @handle or handle
  return { type: "handle", value: trimmed.replace(/^@/, "") };
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("handle");

  if (!input) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  const parsed = parseChannelInput(input);

  try {
    const url =
      parsed.type === "id"
        ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${parsed.value}&key=${apiKey}`
        : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${parsed.value}&key=${apiKey}`;

    const res = await fetch(url);
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