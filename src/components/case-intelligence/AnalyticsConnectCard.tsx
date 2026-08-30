"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Check, Loader2 } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";

interface Summary {
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

/** Maps the callback's `reason` codes to something a user can act on. */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "You declined the analytics permission, or this Google account isn't approved for access yet.",
  missing_code: "Google didn't return an authorization code. Please try again.",
  state_mismatch: "The connection attempt expired or didn't match. Please try again.",
  not_authenticated: "Your session expired. Sign in again, then reconnect.",
  oauth_not_configured: "YouTube analytics isn't configured on the server yet.",
  token_exchange_failed: "Google rejected the connection. Please try again.",
  token_request_failed: "Couldn't reach Google to finish connecting. Please try again.",
  no_refresh_token:
    "Google didn't grant long-term access. Revoke this app's access in your Google account, then reconnect.",
  db_update_failed: "Connected to Google, but saving the connection failed.",
  channel_not_found: "Couldn't match this connection to your channel. Please reselect your channel.",
};

export function AnalyticsConnectCard() {
  const { channelId } = useChannelId();
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    if (!channelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube/analytics-summary?youtubeChannelId=${encodeURIComponent(channelId)}`
      );
      const data = await res.json();
      setConnected(!!data.connected);
      if (data.summary) setSummary(data.summary);
      if (data.error) setError(data.error);
    } catch {
      setError("Could not reach the analytics service.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  /**
   * Asks the server for a Google consent URL built with our own OAuth client,
   * then hands the browser over. Deliberately NOT supabase.auth.signInWithOAuth:
   * that mints the refresh token with the Supabase dashboard's Google client,
   * which youtubeAnalyticsProvider.ts then can't refresh — and it would also
   * re-authenticate the app session as a side effect.
   */
  async function handleConnect() {
    if (!channelId || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube/analytics-connect-url?channelId=${encodeURIComponent(channelId)}`
      );
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start the YouTube connection.");
        setConnecting(false);
        return;
      }
      // Full navigation, not router.push — this leaves the app for Google.
      window.location.href = data.url;
    } catch {
      setError("Could not start the YouTube connection.");
      setConnecting(false);
    }
  }

  const justConnected = searchParams.get("analytics") === "connected";
  const connectError = searchParams.get("analytics") === "error";
  const failureReason = searchParams.get("reason");
  const connectErrorMessage = failureReason
    ? ERROR_MESSAGES[failureReason] ??
      `Couldn't connect YouTube Analytics (${failureReason}). Please try again.`
    : "Couldn't connect YouTube Analytics — try again, and make sure you approve the analytics permission.";

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          <h3 className="text-base font-semibold text-white">YouTube Analytics</h3>
        </div>
        {connected && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Connected
          </span>
        )}
      </div>

      {justConnected && (
        <p className="mt-2 text-xs text-emerald-400" role="status">
          YouTube Analytics connected successfully.
        </p>
      )}
      {connectError && (
        <p className="mt-2 text-xs text-rose-400" role="alert">
          {connectErrorMessage}
        </p>
      )}

      {loading && <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-800/40" />}

      {!loading && connected === false && (
        <div className="mt-4">
          <p className="text-xs text-slate-400">
            Connect your channel&apos;s real analytics — watch time, retention, subscriber trends —
            to power more accurate recommendations and prove channel ownership.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting || !channelId}
            className="mt-3 flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
            {connecting ? "Opening Google…" : "Connect YouTube Analytics"}
          </button>
          {error && (
            <p className="mt-2 text-xs text-rose-400" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {!loading && connected && error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

      {!loading && connected && summary && (
        <div className="mt-4">
          <p className="text-[11px] text-slate-500">
            Last 28 days ({summary.rangeStart} — {summary.rangeEnd})
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-slate-500">Views</p>
              <p className="text-lg font-semibold text-white">{summary.views.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Watch Time (min)</p>
              <p className="text-lg font-semibold text-white">
                {summary.watchTimeMinutes.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Avg. View Duration</p>
              <p className="text-lg font-semibold text-white">
                {summary.averageViewDurationSeconds}s
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Subscribers Gained</p>
              <p className="text-lg font-semibold text-white">
                +{summary.subscribersGained}{" "}
                <span className="text-xs text-slate-500">/ -{summary.subscribersLost}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}