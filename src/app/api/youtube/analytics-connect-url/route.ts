// src/app/api/youtube/analytics-connect-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  ANALYTICS_OAUTH_COOKIE,
  ANALYTICS_CALLBACK_PATH,
  YT_ANALYTICS_SCOPE,
  oauthRedirectUri,
} from "@/lib/youtube/oauth";

/**
 * Analytics-only consent for a channel that was already added by handle. The
 * unified /api/youtube/channel-connect-url flow is preferred — it proves
 * ownership too — but this remains the reconnect path when a stored refresh
 * token goes stale.
 *
 * Uses this app's own GOOGLE_OAUTH_CLIENT_ID rather than Supabase's
 * signInWithOAuth, which mints tokens with the Google client configured in the
 * Supabase dashboard — a different client than youtubeAnalyticsProvider.ts uses
 * to refresh them, so those tokens fail with invalid_grant on first use.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams, origin } = new URL(req.url);
  const youtubeChannelId = searchParams.get("channelId");
  if (!youtubeChannelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  // Reject up front rather than after a pointless round trip through Google.
  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", youtubeChannelId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // CSRF nonce plus the target channel, both in an httpOnly cookie so neither
  // can be tampered with. `state` carries only the nonce.
  const nonce = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(ANALYTICS_OAUTH_COOKIE, JSON.stringify({ nonce, youtubeChannelId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must be lax, not strict — the cookie has to survive Google's redirect back
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri(ANALYTICS_CALLBACK_PATH, origin),
    response_type: "code",
    scope: YT_ANALYTICS_SCOPE,
    access_type: "offline", // required to receive a refresh_token at all
    prompt: "consent", // forces a refresh_token on every consent, not just the first ever
    include_granted_scopes: "true",
    state: nonce,
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
}