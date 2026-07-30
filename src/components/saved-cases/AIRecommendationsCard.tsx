"use client";

import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { AI_RECOMMENDATIONS } from "@/constants/savedCases";

const ICONS = { sparkles: Sparkles, trending: TrendingUp, zap: Zap };

export function AIRecommendationsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-white">AI Recommendations</h3>
        <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
          BETA
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {AI_RECOMMENDATIONS.map((rec, idx) => {
          const Icon = ICONS[rec.icon as keyof typeof ICONS];
          return (
            <div key={idx} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${rec.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[12.5px] font-medium leading-snug text-white">{rec.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{rec.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Recommendations →
      </button>
    </div>
  );
}