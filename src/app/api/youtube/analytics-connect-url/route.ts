import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Builds the Google OAuth authorization URL for YouTube Analytics access,
 * using this app's own GOOGLE_OAUTH_CLIENT_ID rather than routing through
 * Supabase's signInWithOAuth (which uses whatever Google client is
 * configured in the Supabase dashboard — a DIFFERENT client than the one
 * youtubeAnalyticsProvider.ts uses to refresh the token later). A refresh
 * token only works with the exact client that minted it, so this keeps
 * the whole flow on one client end to end.
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
    return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_ID is not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/auth/youtube-analytics-callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/yt-analytics.readonly",
    access_type: "offline",
    prompt: "consent", // forces a refresh_token on every consent, not just the first ever
    state: youtubeChannelId,
  });

  return NextResponse.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
}