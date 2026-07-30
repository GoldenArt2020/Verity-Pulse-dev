"use client";

import { Lightbulb, ChevronRight } from "lucide-react";
import { USAGE_TIPS } from "@/constants/billing";

export function UsageTipsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-[14px] font-semibold text-white">Usage Tips</h3>
      </div>

      <div className="mt-3 space-y-1">
        {USAGE_TIPS.map((tip, i) => (
          <button key={tip} className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-[12px] text-slate-300 hover:bg-slate-800/40">
            {i === 0 ? <span className="font-medium text-white">{tip}</span> : tip}
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
        ))}
      </div>

      <button className="mt-2 text-[12px] font-medium text-blue-400 hover:text-blue-300">View Documentation →</button>
    </div>
  );
}