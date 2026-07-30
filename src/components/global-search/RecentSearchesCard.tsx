"use client";

import { Clock, X } from "lucide-react";
import { RECENT_SEARCHES } from "@/constants/globalSearch";

export function RecentSearchesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Recent Searches</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View all</button>
      </div>

      <div className="mt-3 space-y-1">
        {RECENT_SEARCHES.map((s) => (
          <div key={s} className="flex items-center justify-between rounded-xl px-1 py-2 hover:bg-slate-800/40">
            <span className="flex items-center gap-2 text-[12.5px] text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-500" /> {s}
            </span>
            <button className="text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}