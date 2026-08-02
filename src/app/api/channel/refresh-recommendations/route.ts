import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtubeChannelId } = body as { youtubeChannelId: string };

    if (!youtubeChannelId) {
      return NextResponse.json({ error: "Missing youtubeChannelId" }, { status: 400 });
    }

    const supabase = await createClient();

    // TEMPORARY DEBUG — remove after diagnosing
    const { data: userData } = await supabase.auth.getUser();
    console.error("DEBUG auth user:", userData?.user?.id ?? "NO USER");

    const { data: channelRow, error: channelError } = await supabase
      .from("channels")
      .select("id")
      .eq("youtube_channel_id", youtubeChannelId)
      .single();

    if (channelError || !channelRow) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const summary = await youtubeProvider.getChannelSummaryById(youtubeChannelId);
    if (!summary) {
      return NextResponse.json({ error: "Could not resolve channel from YouTube" }, { status: 502 });
    }

    const videos = await youtubeProvider.getChannelVideos(summary.uploadsPlaylistId, 50);
    const recommendations = await generateRecommendations(channelRow.id, videos);

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refresh recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}