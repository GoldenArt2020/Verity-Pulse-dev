// src/app/api/youtube/channel-connect-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  CHANNEL_CONNECT_COOKIE,
  CHANNEL_CONNECT_CALLBACK_PATH,
  YT_READONLY_SCOPE,
  YT_ANALYTICS_SCOPE,
  oauthRedirectUri,
} from "@/lib/youtube/oauth";

/**
 * Starts the unified "connect my real channel" flow: one consent screen that
 * both proves channel ownership (youtube.readonly + channels?mine=true, which
 * only ever returns channels the authenticated account controls) and grants
 * analytics access, so there's no second consent step for CTR and retention.
 *
 * Unlike the handle-paste path, this cannot be used to claim a channel the
 * user doesn't own.
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
  const baseRegion = searchParams.get("baseRegion");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  // baseRegion rides in an httpOnly cookie rather than `state` so it can't be
  // tampered with, and so `state` stays a pure CSRF nonce.
  const nonce = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(CHANNEL_CONNECT_COOKIE, JSON.stringify({ nonce, baseRegion }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri(CHANNEL_CONNECT_CALLBACK_PATH, origin),
    response_type: "code",
    scope: `${YT_READONLY_SCOPE} ${YT_ANALYTICS_SCOPE}`,
    access_type: "offline", // required to receive a refresh_token at all
    prompt: "consent", // forces a refresh_token on every consent, not just the first ever
    include_granted_scopes: "true",
    state: nonce,
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
}