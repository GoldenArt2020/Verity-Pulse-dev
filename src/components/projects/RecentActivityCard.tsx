"use client";

import { Folder, Users } from "lucide-react";
import { RECENT_ACTIVITY } from "@/constants/projects";

const ICONS = { folder: Folder, users: Users };

export function RecentActivityCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Recent Activity</h3>
        <button className="text-[11px] font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-3">
        {RECENT_ACTIVITY.map((activity, idx) => {
          const Icon = ICONS[activity.icon as keyof typeof ICONS];
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/60">
                <Icon className={`h-3.5 w-3.5 ${activity.color}`} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-snug text-slate-200">{activity.title}</p>
                {activity.sub && (
                  <p className="text-[11px] text-slate-500">{activity.sub}</p>
                )}
                <p className="mt-0.5 text-[10.5px] text-slate-600">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}