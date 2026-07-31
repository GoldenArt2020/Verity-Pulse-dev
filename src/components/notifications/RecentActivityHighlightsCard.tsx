"use client";

import { Folder, Sparkles, MessageCircle, TrendingUp, Award, Link2 } from "lucide-react";
import { RECENT_ACTIVITY_HIGHLIGHTS } from "@/constants/notifications";

const ICON_MAP = { folder: Folder, sparkles: Sparkles, messageCircle: MessageCircle, trendingUp: TrendingUp, award: Award, link: Link2 };

export function RecentActivityHighlightsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Recent Activity Highlights</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All Activity →</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {RECENT_ACTIVITY_HIGHLIGHTS.map((a) => {
          const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
          return (
            <div key={a.title} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-200">{a.title}</p>
              <p className="text-[11px] text-slate-500">{a.desc}</p>
              <p className="mt-1 text-[10.5px] text-slate-600">{a.time}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}