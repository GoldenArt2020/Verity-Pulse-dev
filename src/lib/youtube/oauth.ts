// src/lib/youtube/oauth.ts

/** Single-use CSRF nonce cookies. Must be sameSite:"lax", not "strict" —
 *  the cookie has to survive Google's cross-site redirect back to us. */
export const ANALYTICS_OAUTH_COOKIE = "yt_analytics_oauth_state";
export const CHANNEL_CONNECT_COOKIE = "yt_channel_connect_state";

/** Both are sensitive scopes: the OAuth consent screen must be Published, or
 *  the connecting account listed under Test users, or Google returns
 *  access_denied regardless of how correct the code is. */
export const YT_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
export const YT_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly";

/** The consent request and the token exchange must send a byte-identical
 *  redirect_uri, and it must be registered in Google Cloud Console. Deriving it
 *  from request origin silently breaks on Vercel preview deploys, which get a
 *  fresh hostname each time — set NEXT_PUBLIC_SITE_URL to pin it. */
export function oauthRedirectUri(path: string, origin: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export const ANALYTICS_CALLBACK_PATH = "/auth/youtube-analytics-callback";
export const CHANNEL_CONNECT_CALLBACK_PATH = "/auth/channel-connect-callback";

export interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Exchanges a Google authorization code with GOOGLE, using this app's own
 * OAuth client. Deliberately not supabase.auth.exchangeCodeForSession — that
 * only understands codes Supabase itself issued, and tokens it mints belong to
 * the Google client configured in the Supabase dashboard, which
 * youtubeAnalyticsProvider.ts then cannot refresh.
 *
 * Throws Error with a machine-readable code suitable for a ?reason= param.
 */
export async function exchangeCodeForGoogleTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("oauth_not_configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    // Body carries the real cause: redirect_uri_mismatch, invalid_client, etc.
    console.error("[oauth] token exchange failed:", res.status, await res.text());
    throw new Error("token_exchange_failed");
  }

  return (await res.json()) as GoogleTokenResponse;
}