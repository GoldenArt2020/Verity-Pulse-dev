// src/app/auth/channel-connect-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connectChannel } from "@/services/connectChannel";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

/**
 * Single OAuth round-trip that covers everything: proves the signed-in
 * Google account actually OWNS the channel being connected (via
 * `mine=true`, which only ever returns channels the authenticated account
 * controls), grants YouTube Analytics access in the same consent screen,
 * and immediately runs the full connect pipeline (Creator DNA, videos,
 * recommendations) — so there's no separate "connect analytics later"
 * step for the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/discover?connect=cancelled`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/discover?connect=error`);
  }

  const accessToken = data.session.provider_token;
  const refreshToken = data.session.provider_refresh_token;

  if (!accessToken) {
    return NextResponse.redirect(`${origin}/discover?connect=error`);
  }

  try {
    // mine=true only ever returns channels this authenticated Google
    // account actually owns — this IS the ownership proof.
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channelData = await channelRes.json();
    const item = channelData.items?.[0];

    if (!item) {
      // Authenticated fine, but this Google account has no YouTube channel.
      return NextResponse.redirect(`${origin}/discover?connect=no-channel`);
    }

    const channelSummary: YouTubeChannelSummary = {
      channelId: item.id,
      title: item.snippet.title,
      handle: item.snippet.customUrl ?? item.snippet.title,
      description: item.snippet.description ?? "",
      thumbnailUrl: item.snippet.thumbnails?.default?.url ?? "",
      subscriberCount: parseInt(item.statistics?.subscriberCount ?? "0", 10),
      videoCount: parseInt(item.statistics?.videoCount ?? "0", 10),
      viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? "",
      country: item.snippet.country ?? null,
    };

    const result = await connectChannel(supabase, channelSummary, data.user.id);

    // Same OAuth grant included the analytics scope, so we already have
    // the refresh token right here — store it against the same row we
    // just created/found, no second consent needed.
    if (refreshToken) {
      await supabase
        .from("channels")
        .update({
          youtube_analytics_refresh_token: refreshToken,
          youtube_analytics_connected_at: new Date().toISOString(),
          youtube_analytics_scope: "yt-analytics.readonly",
        })
        .eq("id", result.channelRowId);
    }

    return NextResponse.redirect(`${origin}/discover?connected=${result.channelRowId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "connect-failed";
    return NextResponse.redirect(`${origin}/discover?connect=error&reason=${encodeURIComponent(message)}`);
  }
}