"use client";

import { useState } from "react";
import { Clock, TrendingUp, Search, Flame, ChevronDown } from "lucide-react";
import { PRODUCTIVITY_INSIGHTS } from "@/constants/userProfile";

const ICON_MAP = { clock: Clock, trendingUp: TrendingUp, search: Search, flame: Flame };

export function ProductivityInsightsCard() {
  const [range, setRange] = useState("This Month");
  const score = 92;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Productivity Insights</h3>
        <button className="flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800/50">
          {range} <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold text-white">{score}%</span>
            <span className="text-[9.5px] text-slate-500">Productivity Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {PRODUCTIVITY_INSIGHTS.map((insight, idx) => {
            const Icon = ICON_MAP[insight.icon as keyof typeof ICON_MAP];
            return (
              <div key={idx} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />
                <p className="text-[11.5px] leading-snug text-slate-300">
                  {insight.title} {insight.highlight && <span className="font-semibold text-white">{insight.highlight}</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-emerald-400">↑ 14% vs last month</p>
    </div>
  );
}