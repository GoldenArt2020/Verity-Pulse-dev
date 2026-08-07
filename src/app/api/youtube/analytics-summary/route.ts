// src/app/api/youtube/analytics-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChannelAnalyticsSummary } from "@/providers/youtube/youtubeAnalyticsProvider";

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
    const summary = await getChannelAnalyticsSummary(channel.youtube_analytics_refresh_token);
    return NextResponse.json({ connected: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ connected: true, error: message }, { status: 502 });
  }
}