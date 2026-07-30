"use client";

import { Laptop, MoreVertical } from "lucide-react";
import { RECENT_SESSIONS } from "@/constants/userProfile";

export function RecentSessionsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Recent Sessions</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {RECENT_SESSIONS.map((s, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-slate-800/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <Laptop className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-slate-200">{s.device}</p>
                <p className="truncate text-[10.5px] text-slate-500">{s.location}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-[10.5px] ${s.active ? "font-medium text-emerald-400" : "text-slate-500"}`}>
                {s.time}
              </span>
              <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}