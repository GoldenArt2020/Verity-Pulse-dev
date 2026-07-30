"use client";

import { Sparkles, Target, TrendingUp, Users, FileText, CheckCircle2 } from "lucide-react";
import { ACTIVITY_FEED } from "@/constants/aiAssistant";

const ICON_MAP = { sparkles: Sparkles, target: Target, trendingUp: TrendingUp, users: Users, fileText: FileText };

export function ActivityFeedCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Activity Feed</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All Activity →</button>
      </div>

      <div className="mt-3 space-y-1">
        {ACTIVITY_FEED.map((a) => {
          const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
          return (
            <div key={a.title} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-slate-800/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="truncate text-[12.5px] font-medium text-slate-200">{a.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-slate-500">{a.time}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}