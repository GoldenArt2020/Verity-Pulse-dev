import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { getTrendingVideoInsight, getDropOffInsightsForChannel } from "@/services/channelInsights";

export async function GET(req: NextRequest) {
  const youtubeChannelId = req.nextUrl.searchParams.get("youtubeChannelId");
  if (!youtubeChannelId) {
    return NextResponse.json({ error: "Missing youtubeChannelId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: channel, error } = await supabase
    .from("channels")
    .select("youtube_analytics_refresh_token")
    .eq("youtube_channel_id", youtubeChannelId)
    .single();

  if (error || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  if (!channel.youtube_analytics_refresh_token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const channelSummary = await youtubeProvider.getChannelSummaryById(youtubeChannelId);
    if (!channelSummary) {
      return NextResponse.json({ error: "Could not load channel from YouTube" }, { status: 502 });
    }

    const [trending, dropOffs] = await Promise.all([
      getTrendingVideoInsight(channel.youtube_analytics_refresh_token, channelSummary.uploadsPlaylistId),
      getDropOffInsightsForChannel(channel.youtube_analytics_refresh_token, channelSummary.uploadsPlaylistId),
    ]);

    return NextResponse.json({ connected: true, trending, dropOffs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch channel insights";
    return NextResponse.json({ connected: true, error: message }, { status: 502 });
  }
}