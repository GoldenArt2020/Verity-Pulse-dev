"use client";

import { Info, TrendingUp, Play, MessageSquare, Target, AlertTriangle, ChevronRight } from "lucide-react";

const FEED = [
  { icon: TrendingUp, color: "text-blue-400 bg-blue-500/15", text: 'Search interest for "Lana Purcell" increased 240% in the past 7 days.', time: "Just now" },
  { icon: Play, color: "text-blue-400 bg-blue-500/15", text: "2 new documentary videos published on similar cases.", time: "12 minutes ago" },
  { icon: MessageSquare, color: "text-amber-400 bg-amber-500/15", text: 'Reddit discussion spike detected in r/TrueCrime for "Soho House".', time: "32 minutes ago" },
  { icon: Target, color: "text-emerald-400 bg-emerald-500/15", text: 'Low competition opportunity detected in "Kentish Town" cases.', time: "1 hour ago" },
  { icon: AlertTriangle, color: "text-rose-400 bg-rose-500/15", text: "You haven't published in 5 days. Consider scheduling content.", time: "2 hours ago" },
];

export function IntelligenceFeedStrip() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-white">Intelligence Feed</h3>
          <Info className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4">
        {FEED.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="flex flex-col gap-2 border-l border-slate-800/60 pl-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${f.color}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <p className="text-xs leading-snug text-slate-300">{f.text}</p>
              <span className="text-[10px] text-slate-500">{f.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}