"use client";

import { Sparkles } from "lucide-react";
import { useChannelDNA } from "@/hooks/useChannelDNA";

export function AIInsightCard() {
  const { dna, loading } = useChannelDNA();

  if (loading || !dna) return null;

  const topStrength = dna.strengths[0];
  const topSubject = dna.channelStyle.preferredSubjects[0];

  return (
    <div className="rounded-[18px] border border-blue-500/20 bg-blue-500/[0.04] p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-blue-400">Today&apos;s AI Insight</p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
        {topSubject
          ? `${topSubject.charAt(0).toUpperCase() + topSubject.slice(1)} cases are trending with your audience but remain under-covered on YouTube.`
          : "Your audience responds strongly to your core content — new matching opportunities are surfacing."}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
        <div>
          <p className="text-[10px] text-[#71717A]">Confidence</p>
          <p className="text-sm font-bold text-[#FAFAFA]">96%</p>
        </div>
        <div>
          <p className="text-[10px] text-[#71717A]">Strength</p>
          <p className="text-sm font-bold text-emerald-400">High</p>
        </div>
        <div>
          <p className="text-[10px] text-[#71717A]">Window</p>
          <p className="text-sm font-bold text-[#FAFAFA]">Now</p>
        </div>
      </div>

      {topStrength && (
        <p className="mt-3 text-xs text-[#71717A]">Based on your strength in {topStrength}.</p>
      )}
    </div>
  );
}