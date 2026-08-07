"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Check, Loader2 } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";
import { createClient } from "@/lib/supabase/client";

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

export function AnalyticsConnectCard() {
  const { channelId } = useChannelId();
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    if (!channelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/youtube/analytics-summary?youtubeChannelId=${channelId}`);
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

  async function handleConnect() {
    if (!channelId) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/yt-analytics.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/youtube-analytics-callback?state=${channelId}`,
      },
    });
  }

  const justConnected = searchParams.get("analytics") === "connected";
  const connectError = searchParams.get("analytics") === "error";

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
        <p className="mt-2 text-xs text-emerald-400">YouTube Analytics connected successfully.</p>
      )}
      {connectError && (
        <p className="mt-2 text-xs text-rose-400">
          Couldn&apos;t connect YouTube Analytics — try again, and make sure you approve the analytics permission.
        </p>
      )}

      {loading && <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-800/40" />}

      {!loading && connected === false && (
        <div className="mt-4">
          <p className="text-xs text-slate-400">
            Connect your channel&apos;s real analytics — watch time, retention, subscriber trends — to power more accurate recommendations and prove channel ownership.
          </p>
          <button
            onClick={handleConnect}
            className="mt-3 flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Connect YouTube Analytics
          </button>
        </div>
      )}

      {!loading && connected && error && (
        <p className="mt-3 text-xs text-rose-400">{error}</p>
      )}

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
              <p className="text-lg font-semibold text-white">{summary.watchTimeMinutes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Avg. View Duration</p>
              <p className="text-lg font-semibold text-white">{summary.averageViewDurationSeconds}s</p>
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