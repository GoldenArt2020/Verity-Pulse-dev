"use client";

import { useChannelDNA } from "@/hooks/useChannelDNA";

export function AudienceBreakdown() {
  const { dna, loading } = useChannelDNA();

  if (loading) {
    return <div className="h-40 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]" />;
  }
  if (!dna) return null;

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <p className="text-sm font-semibold text-[#FAFAFA]">Your Audience</p>
      <p className="mt-0.5 text-xs text-[#71717A]">Based on your channel&apos;s Creator DNA</p>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-emerald-400">What works best</p>
          <ul className="mt-2 space-y-1.5">
            {dna.strengths.slice(0, 3).map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <span className="text-emerald-400">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-rose-400">What works less</p>
          <ul className="mt-2 space-y-1.5">
            {dna.weaknesses.slice(0, 3).map((w) => (
              <li key={w} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <span className="text-rose-400">✕</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}