"use client";

import { RefreshCw } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";
import { useChannelStats } from "@/hooks/useChannelStats";
import { useChannelDNA } from "@/hooks/useChannelDNA";
import { useRelativeTime } from "@/hooks/useRelativeTime";

export function ChannelStatusPanel() {
  const { channelId, channelHandle } = useChannelId();
  const { stats, loading: statsLoading, refresh, lastSyncedAt } = useChannelStats(channelId);
  const { dna, loading: dnaLoading } = useChannelDNA();
  const relativeSync = useRelativeTime(lastSyncedAt);

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAFAFA]">Your Channel</p>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
          {channelHandle?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#FAFAFA]">@{channelHandle}</p>
          <span className="text-xs font-medium text-emerald-400">Connected</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
        <div>
          <p className="text-sm font-bold text-[#FAFAFA]">
            {statsLoading ? "—" : (stats?.videoCount ?? "—")}
          </p>
          <p className="text-[10px] text-[#71717A]">Videos</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#FAFAFA]">
            {statsLoading ? "—" : (stats?.subscriberCount?.toLocaleString() ?? "—")}
          </p>
          <p className="text-[10px] text-[#71717A]">Subscribers</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#FAFAFA]">
            {statsLoading ? "—" : (stats?.viewCount?.toLocaleString() ?? "—")}
          </p>
          <p className="text-[10px] text-[#71717A]">Views</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#71717A]">
        {statsLoading ? "Syncing…" : relativeSync ? `Last synced ${relativeSync}` : "Not yet synced"}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-xs text-[#71717A]">Creator DNA</p>
          <p className={`text-xs font-medium ${dnaLoading ? "text-[#71717A]" : dna ? "text-emerald-400" : "text-amber-400"}`}>
            {dnaLoading ? "Loading…" : dna ? "Ready" : "Not yet built"}
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-blue-400"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync now
        </button>
      </div>
    </div>
  );
}