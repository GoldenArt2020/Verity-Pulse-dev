"use client";

import { Check, X } from "lucide-react";
import { useChannelDNA } from "@/hooks/useChannelDNA";

export function CreatorDNACard() {
  const { dna, loading, error } = useChannelDNA();

  if (loading) {
    return (
      <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-2 h-5 w-56 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
        <p className="text-sm text-rose-400">Couldn&apos;t load Creator DNA: {error}</p>
      </div>
    );
  }

  if (!dna) {
    return (
      <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
        <p className="text-sm text-[#A1A1AA]">
          Connect your channel to see what your audience responds to.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <p className="text-sm text-[#A1A1AA]">We&apos;ve analyzed your channel.</p>
      <h3 className="mt-1 text-lg font-semibold text-[#FAFAFA]">Here&apos;s what we learned.</h3>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-[#71717A]">Your audience responds best to</p>
          <div className="mt-3 space-y-2">
            {dna.strengths.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm text-[#FAFAFA]">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {s}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-[#71717A]">Less successful topics</p>
          <div className="mt-3 space-y-2">
            {dna.weaknesses.map((w) => (
              <div key={w} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <X className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}