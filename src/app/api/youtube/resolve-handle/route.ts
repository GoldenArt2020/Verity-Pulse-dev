import { NextRequest, NextResponse } from "next/server";

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

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube provider not configured" }, { status: 503 });
  }

  const parsed = parseChannelInput(input);

  try {
    const url =
      parsed.type === "id"
        ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${parsed.value}&key=${apiKey}`
        : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${parsed.value}&key=${apiKey}`;

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
      description: item.snippet.description ?? "",
      thumbnail: item.snippet.thumbnails?.default?.url,
      subscriberCount: item.statistics.subscriberCount,
      videoCount: parseInt(item.statistics.videoCount ?? "0", 10),
      viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve handle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}