// src/app/auth/youtube-analytics-callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  ANALYTICS_OAUTH_COOKIE,
  ANALYTICS_CALLBACK_PATH,
  oauthRedirectUri,
  exchangeCodeForGoogleTokens,
} from "@/lib/youtube/oauth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const stateNonce = searchParams.get("state");

  const cookieStore = await cookies();
  const rawState = cookieStore.get(ANALYTICS_OAUTH_COOKIE)?.value;
  cookieStore.delete(ANALYTICS_OAUTH_COOKIE); // single use, whatever the outcome

  let expectedNonce: string | null = null;
  let youtubeChannelId: string | null = null;
  if (rawState) {
    try {
      const parsed = JSON.parse(rawState) as { nonce?: string; youtubeChannelId?: string };
      expectedNonce = parsed.nonce ?? null;
      youtubeChannelId = parsed.youtubeChannelId ?? null;
    } catch {
      expectedNonce = null;
    }
  }

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${origin}/channel-intelligence?analytics=error&reason=${encodeURIComponent(reason)}`
    );

  // Google sends ?error=access_denied when the user cancels, or when the app is
  // unpublished and the account isn't a registered test user.
  if (oauthError) return fail(oauthError);
  if (!code) return fail("missing_code");
  if (!stateNonce || !expectedNonce || stateNonce !== expectedNonce) {
    return fail("state_mismatch");
  }
  if (!youtubeChannelId) return fail("state_mismatch");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("not_authenticated");

  let tokens;
  try {
    tokens = await exchangeCodeForGoogleTokens(
      code,
      oauthRedirectUri(ANALYTICS_CALLBACK_PATH, origin)
    );
  } catch (err) {
    // Helper throws machine-readable codes suitable for a ?reason= param.
    return fail(err instanceof Error ? err.message : "token_exchange_failed");
  }

  if (!tokens.refresh_token) {
    // Google omits refresh_token unless access_type=offline AND prompt=consent.
    console.error("[youtube-analytics-callback] no refresh_token in token response");
    return fail("no_refresh_token");
  }

  // Scoped to a channel this user owns. select() distinguishes "wrong owner or
  // blocked by RLS" from "write failed".
  const { data: updated, error: updateError } = await supabase
    .from("channels")
    .update({
      youtube_analytics_refresh_token: tokens.refresh_token,
      youtube_analytics_connected_at: new Date().toISOString(),
      youtube_analytics_scope: tokens.scope ?? "yt-analytics.readonly",
    })
    .eq("youtube_channel_id", youtubeChannelId)
    .eq("user_id", user.id)
    .select("id");

  if (updateError) {
    console.error("[youtube-analytics-callback] db update failed:", updateError);
    return fail("db_update_failed");
  }

  if (!updated || updated.length === 0) {
    console.error("[youtube-analytics-callback] no channel row matched", {
      youtubeChannelId,
      userId: user.id,
    });
    return fail("channel_not_found");
  }

  return NextResponse.redirect(`${origin}/channel-intelligence?analytics=connected`);
}