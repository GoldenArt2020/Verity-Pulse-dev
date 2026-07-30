"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useChannelId } from "@/hooks/useChannelId";

export function ChannelInput() {
  const [input, setInput] = useState("");
  const { saveChannelId } = useChannelId();

  function handleAnalyze() {
    if (!input.trim()) {
      toast.error("Paste a YouTube channel ID.");
      return;
    }
    saveChannelId(input.trim());
    toast.success("Channel saved. Loading stats...");
  }

  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube Channel ID (e.g. UCxxxxxxxxxxxxxxxxxxxxxx)"
          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-11 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50"
        />
      </div>
      <button
        onClick={handleAnalyze}
        className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98]"
      >
        Analyze
      </button>
    </div>
  );
}