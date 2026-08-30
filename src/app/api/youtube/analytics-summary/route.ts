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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Scoped to this user's own channels — without the user_id filter any caller
  // could read another account's analytics by guessing a channel id.
  // maybeSingle, not single: two users connecting the same channel would throw.
  const { data: channel, error } = await supabase
    .from("channels")
    .select("youtube_analytics_refresh_token")
    .eq("youtube_channel_id", youtubeChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

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

    // invalid_grant means the refresh token is dead: revoked, or — the bug this
    // change fixes — minted by a different OAuth client than the one refreshing
    // it. Every token stored before this fix falls in that second category, so
    // report it as not connected to surface a reconnect prompt rather than a
    // red error the user can't act on.
    if (message.includes("invalid_grant")) {
      return NextResponse.json({
        connected: false,
        error: "Your YouTube Analytics connection expired. Please reconnect.",
      });
    }

    return NextResponse.json({ connected: true, error: message }, { status: 502 });
  }
}