"use client";

import { Calendar, Users } from "lucide-react";
import { UPCOMING_REMINDERS } from "@/constants/notifications";

const ICON_MAP = { calendar: Calendar, users: Users };

export function UpcomingRemindersCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Upcoming Reminders</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View Calendar →</button>
      </div>

      <div className="mt-3 space-y-1">
        {UPCOMING_REMINDERS.map((r) => {
          const Icon = ICON_MAP[r.icon as keyof typeof ICON_MAP];
          return (
            <div key={r.title} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-slate-800/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{r.title}</p>
                  <p className="truncate text-[11px] text-slate-500">{r.desc}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">{r.tag}</span>
                <span className="mt-1 block text-[10.5px] text-slate-500">{r.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}