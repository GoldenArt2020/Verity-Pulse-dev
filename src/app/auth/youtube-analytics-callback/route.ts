// src/app/auth/youtube-analytics-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const youtubeChannelId = searchParams.get("state"); // we pass the channel's youtube_channel_id as `state`

  if (!code) {
    return NextResponse.redirect(`${origin}/channel-intelligence?analytics=error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.provider_refresh_token) {
    return NextResponse.redirect(`${origin}/channel-intelligence?analytics=error`);
  }

  if (youtubeChannelId) {
    await supabase
      .from("channels")
      .update({
        youtube_analytics_refresh_token: data.session.provider_refresh_token,
        youtube_analytics_connected_at: new Date().toISOString(),
        youtube_analytics_scope: "yt-analytics.readonly",
      })
      .eq("youtube_channel_id", youtubeChannelId);
  }

  return NextResponse.redirect(`${origin}/channel-intelligence?analytics=connected`);
}