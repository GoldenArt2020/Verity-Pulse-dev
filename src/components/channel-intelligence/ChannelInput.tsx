"use client";

<<<<<<< HEAD
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChannelId } from "@/hooks/useChannelId";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

export function ChannelInput() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveChannel } = useChannelId();
  const { user, isAuthenticated } = useAuthUser();

  async function handleAnalyze() {
    if (!input.trim()) {
      toast.error("Paste a YouTube channel ID.");
      return;
    }
    if (!isAuthenticated || !user) {
      toast.error("You must be signed in to connect a channel.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/youtube/resolve-handle?handle=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Channel not found");

      const channelSummary: YouTubeChannelSummary = {
        channelId: data.channelId,
        title: data.title,
        handle: input.trim(),
        description: data.description ?? "",
        thumbnailUrl: data.thumbnail ?? "",
        subscriberCount: data.subscriberCount ?? 0,
        videoCount: data.videoCount ?? 0,
        viewCount: data.viewCount ?? 0,
        uploadsPlaylistId: data.uploadsPlaylistId ?? "",
      };

      const connectRes = await fetch("/api/channel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelSummary, userId: user.id }),
      });
      const connectData = await connectRes.json();
      if (!connectRes.ok) throw new Error(connectData.error ?? "Failed to connect channel");

      await saveChannel(connectData.channelRowId);
      toast.success("Channel saved. Loading stats...");
      setInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze channel";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube Channel ID (e.g. UCxxxxxxxxxxxxxxxxxxxxxx)"
          disabled={loading}
          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-11 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 disabled:opacity-60"
        />
      </div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Analyzing..." : "Analyze"}
=======
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Drop this into the Channel Intelligence page below the channel input,
 * as before. It's a second, separate consent step — deliberately not
 * combined with channel connection.
 *
 * Usage: <ConnectYouTubeAnalytics channelRowId={channel.id} />
 */
export function ConnectYouTubeAnalytics({
  channelRowId,
  connected,
}: {
  channelRowId: string;
  connected?: boolean;
}) {
  async function handleConnectAnalytics() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/yt-analytics.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/analytics-connect-callback`,
        // Supabase passes this straight through to Google's OAuth
        // `state` param, which our callback reads back out.
        // If your Supabase client version doesn't support a `state` option
        // directly, append it to redirectTo as a query param instead:
        // redirectTo: `${window.location.origin}/auth/analytics-connect-callback?state=${channelRowId}`
      },
    });
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-[14px] border border-white/[0.06] bg-[#18181B] px-4 py-3 text-sm text-[#A1A1AA]">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        YouTube Analytics connected
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-[#18181B] p-4">
      <p className="text-sm text-[#FAFAFA]">YouTube Analytics</p>
      <p className="mt-1 text-xs text-[#71717A]">
        Grant analytics access to see real views, watch time, and subscriber
        data for this channel.
      </p>
      <button
        onClick={handleConnectAnalytics}
        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-blue-500 px-4 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
      >
        Connect YouTube Analytics
>>>>>>> 5ba4604 (Recommendations: 8-factor VerityPulse scoring (Creator DNA/Audience/Search/Competition/Angles/Region/Momentum/Historical), real region display with exception badges, cross-channel exclusion preserved)
      </button>
    </div>
  );
}
