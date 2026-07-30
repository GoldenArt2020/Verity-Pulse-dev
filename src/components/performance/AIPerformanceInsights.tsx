"use client";

import { TrendingUp, Clock, Users, Target } from "lucide-react";

const INSIGHTS = [
  { icon: TrendingUp, color: "bg-emerald-500/15 text-emerald-400", text: "Videos about institutional failure get", highlight: "34% more views", sub: "than your channel average." },
  { icon: Clock, color: "bg-blue-500/15 text-blue-400", text: "Your average view duration is improving.", highlight: "", sub: "Keep using long-form storytelling." },
  { icon: Users, color: "bg-purple-500/15 text-purple-400", text: "", highlight: "Thursday at 6PM", sub: "is your best performing publish time." },
  { icon: Target, color: "bg-amber-500/15 text-amber-400", text: "Titles with 'Police' and 'Ignored' have", highlight: "the highest CTR (7.8%).", sub: "" },
];

export function AIPerformanceInsights() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-white">AI Performance Insights</h3>
        <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">BETA</span>
      </div>
      <p className="text-[11px] text-slate-500">Insights based on your last 30 uploads</p>

      <div className="mt-3 space-y-1">
        {INSIGHTS.map((i, idx) => {
          const Icon = i.icon;
          return (
            <div key={idx} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${i.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-[12px] leading-snug text-slate-300">
                {i.text} {i.highlight && <span className="font-semibold text-white">{i.highlight}</span>} {i.sub}
              </p>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/40">
        View All Insights
      </button>
    </div>
  );
}