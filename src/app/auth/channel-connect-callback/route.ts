// src/app/auth/channel-connect-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { connectChannel } from "@/services/connectChannel";
import {
  CHANNEL_CONNECT_COOKIE,
  CHANNEL_CONNECT_CALLBACK_PATH,
  oauthRedirectUri,
  exchangeCodeForGoogleTokens,
} from "@/lib/youtube/oauth";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

// connectChannel builds Creator DNA, fetches 50 videos, and generates
// recommendations — well past the default serverless limit on Vercel.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const stateNonce = searchParams.get("state");

  const cookieStore = await cookies();
  const rawState = cookieStore.get(CHANNEL_CONNECT_COOKIE)?.value;
  cookieStore.delete(CHANNEL_CONNECT_COOKIE); // single use, whatever the outcome

  let expectedNonce: string | null = null;
  let baseRegion: string | null = null;
  if (rawState) {
    try {
      const parsed = JSON.parse(rawState) as { nonce?: string; baseRegion?: string | null };
      expectedNonce = parsed.nonce ?? null;
      baseRegion = parsed.baseRegion ?? null;
    } catch {
      expectedNonce = null;
    }
  }

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${origin}/channel-intelligence?connect=error&reason=${encodeURIComponent(reason)}`
    );

  // Google sends ?error=access_denied when the user cancels, or when the app is
  // unpublished and the account isn't a registered test user.
  if (oauthError) return fail(oauthError);
  if (!code) return fail("missing_code");
  if (!stateNonce || !expectedNonce || stateNonce !== expectedNonce) {
    return fail("state_mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("not_authenticated");

  try {
    const tokens = await exchangeCodeForGoogleTokens(
      code,
      oauthRedirectUri(CHANNEL_CONNECT_CALLBACK_PATH, origin)
    );

    if (!tokens.access_token) return fail("no_access_token");

    // mine=true only ever returns channels this authenticated Google account
    // actually owns — this IS the ownership proof.
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!channelRes.ok) {
      console.error(
        "[channel-connect-callback] channels?mine=true failed:",
        channelRes.status,
        await channelRes.text()
      );
      return fail("channel_lookup_failed");
    }

    const channelData = await channelRes.json();
    const item = channelData.items?.[0];

    // Authenticated fine, but this Google account has no YouTube channel.
    if (!item) return fail("no_channel");

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

    // Returns the existing row if this channel was already added by hand, so
    // OAuth upgrades that row rather than duplicating it.
    const result = await connectChannel(supabase, channelSummary, user.id, baseRegion);

    if (!tokens.refresh_token) {
      // Channel is connected and ownership proven, but analytics won't work.
      // Usually means a stale prior grant; revoking in Google account settings
      // and reconnecting fixes it.
      console.error("[channel-connect-callback] no refresh_token in token response");
      return NextResponse.redirect(
        `${origin}/channel-intelligence?connected=${result.channelRowId}&analytics=error&reason=no_refresh_token`
      );
    }

    const { error: updateError } = await supabase
      .from("channels")
      .update({
        youtube_analytics_refresh_token: tokens.refresh_token,
        youtube_analytics_connected_at: new Date().toISOString(),
        youtube_analytics_scope: tokens.scope ?? "yt-analytics.readonly",
      })
      .eq("id", result.channelRowId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[channel-connect-callback] token save failed:", updateError);
      return fail("db_update_failed");
    }

    return NextResponse.redirect(
      `${origin}/channel-intelligence?connected=${result.channelRowId}&analytics=connected`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "connect_failed";
    console.error("[channel-connect-callback] failed:", err);
    return fail(message);
  }
}