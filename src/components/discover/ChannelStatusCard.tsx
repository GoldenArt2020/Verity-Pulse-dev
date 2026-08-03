"use client";

import { RefreshCw } from "lucide-react";
import { useChannelDNA } from "@/hooks/useChannelDNA";

function cleanHandle(raw: string): string {
  const urlMatch = raw.match(/youtube\.com\/(?:@|channel\/)([a-zA-Z0-9_.-]+)/);
  if (urlMatch) return urlMatch[1];
  return raw.replace(/^@/, "");
}

export function ChannelStatusCard({ channelHandle }: { channelHandle: string }) {
  const { dna, loading } = useChannelDNA();
  const displayHandle = cleanHandle(channelHandle);

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#71717A]">Your Channel</p>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-sm font-bold text-[#FAFAFA]">
          {displayHandle.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#FAFAFA]">@{displayHandle}</p>
          <p className="text-xs text-emerald-400">Connected</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
        <span className="text-[#71717A]">Creator DNA</span>
        <span className={loading ? "text-amber-400" : "text-emerald-400"}>
          {loading ? "Building..." : dna ? "Ready" : "Pending"}
        </span>
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]">
        <RefreshCw className="h-3 w-3" />
        Sync now
      </button>
    </div>
  );
}