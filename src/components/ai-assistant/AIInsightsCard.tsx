"use client";

import { TrendingUp } from "lucide-react";
import { AI_INSIGHTS } from "@/constants/aiAssistant";

export function AIInsightsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
          ✨ AI Insights
        </h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All Insights →</button>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-white">{AI_INSIGHTS.featured.title}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-slate-400">{AI_INSIGHTS.featured.desc}</p>
          </div>
        </div>
        <button className="mt-2 text-[11.5px] font-medium text-blue-400 hover:text-blue-300">View Details</button>
      </div>

      <div className="mt-3 space-y-3">
        {AI_INSIGHTS.items.map((item) => (
          <div key={item.title} className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
            <div>
              <p className="text-[12px] font-medium text-slate-200">{item.title}</p>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}