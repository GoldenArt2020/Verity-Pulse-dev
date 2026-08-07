// src/providers/youtube/youtubeAnalyticsProvider.ts
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports";

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Exchanges a stored refresh token for a short-lived access token. Refresh
 * tokens from Google don't expire on their own (unless revoked), so this
 * runs fresh on every analytics request rather than trying to cache access
 * tokens across requests — simpler and avoids stale-token edge cases for a
 * feature that isn't called on every page load.
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not configured");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to refresh YouTube Analytics token: ${res.status} ${body}`);
  }

  const data = (await res.json()) as AccessTokenResponse;
  return data.access_token;
}

export interface ChannelAnalyticsSummary {
  views: number;
  watchTimeMinutes: number;
  averageViewDurationSeconds: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  shares: number;
  rangeStart: string;
  rangeEnd: string;
}

/**
 * Fetches channel-level totals for the last `days` days. This is a starting
 * summary view — per-video breakdowns and traffic-source data are natural
 * next additions once this base connection is confirmed working.
 */
export async function getChannelAnalyticsSummary(
  refreshToken: string,
  days = 28
): Promise<ChannelAnalyticsSummary> {
  const accessToken = await getAccessToken(refreshToken);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate: fmt(start),
    endDate: fmt(end),
    metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares",
  });

  const res = await fetch(`${REPORTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube Analytics request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const row: number[] = data.rows?.[0] ?? [];

  return {
    views: row[0] ?? 0,
    watchTimeMinutes: row[1] ?? 0,
    averageViewDurationSeconds: row[2] ?? 0,
    subscribersGained: row[3] ?? 0,
    subscribersLost: row[4] ?? 0,
    likes: row[5] ?? 0,
    comments: row[6] ?? 0,
    shares: row[7] ?? 0,
    rangeStart: fmt(start),
    rangeEnd: fmt(end),
  };
}