"use client";

import { TrendingUp, Scale, Users } from "lucide-react";
import { AI_TEAM_INSIGHTS } from "@/constants/team";

const ICONS = { trendingUp: TrendingUp, scale: Scale, users: Users };

export function AITeamInsightsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-white">AI Team Insights</h3>
        <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
          BETA
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {AI_TEAM_INSIGHTS.map((insight, idx) => {
          const Icon = ICONS[insight.icon as keyof typeof ICONS];
          return (
            <div key={idx} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${insight.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-[12.5px] leading-snug text-slate-200">
                {insight.title} <span className="font-semibold text-white">{insight.highlight}</span>
              </p>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View All Insights →
      </button>
    </div>
  );
}