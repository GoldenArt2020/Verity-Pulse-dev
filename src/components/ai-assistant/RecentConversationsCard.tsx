"use client";

import { Search, Target, TrendingUp, Users, FileText, MoreVertical, RotateCw } from "lucide-react";
import { RECENT_CONVERSATIONS } from "@/constants/aiAssistant";

const ICON_MAP = { search: Search, target: Target, trendingUp: TrendingUp, users: Users, fileText: FileText };

export function RecentConversationsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Recent Conversations</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All →</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {RECENT_CONVERSATIONS.map((c) => {
          const Icon = ICON_MAP[c.icon as keyof typeof ICON_MAP];
          return (
            <div key={c.title} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[12.5px] font-semibold text-white">{c.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{c.desc}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10.5px] text-slate-600">
                  <RotateCw className="h-3 w-3" /> {c.time}
                </span>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}