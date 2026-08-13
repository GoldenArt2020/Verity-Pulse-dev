"use client";

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
        country: data.country ?? null,
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
      </button>
    </div>
  );
}