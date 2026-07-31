"use client";

import { Check, X } from "lucide-react";
import { CREATOR_DNA } from "@/constants/creatorDNA";

export function CreatorDNACard() {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <p className="text-sm text-[#A1A1AA]">We&apos;ve analyzed your channel.</p>
      <h3 className="mt-1 text-lg font-semibold text-[#FAFAFA]">Here&apos;s what we learned.</h3>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-[#71717A]">Your audience responds best to</p>
          <div className="mt-3 space-y-2">
            {CREATOR_DNA.strengths.map((s) => (
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
            {CREATOR_DNA.weaknesses.map((w) => (
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