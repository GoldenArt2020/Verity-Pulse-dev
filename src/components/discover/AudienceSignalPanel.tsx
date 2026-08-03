"use client";

import { Sparkles } from "lucide-react";
import { useChannelDNA } from "@/hooks/useChannelDNA";

export function AudienceSignalPanel() {
  const { dna, loading } = useChannelDNA();

  const signals = [
    ...(dna?.channelStyle?.preferredSubjects ?? []),
    ...(dna?.channelStyle?.typicalHooks ?? []),
  ].slice(0, 3);

  if (loading || signals.length === 0) return null;

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-400" />
        <p className="text-sm font-semibold text-[#FAFAFA]">Recommended For Your Audience</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA]">
        Based on your recent uploads, your audience is currently responding best to:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {signals.map((s) => (
          <span
            key={s}
            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
          >
            ✓ {s}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#71717A]">
        We&apos;ve filtered today&apos;s recommendations using those signals.
      </p>
    </div>
  );
}