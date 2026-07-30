"use client";

import { ChevronDown } from "lucide-react";
import { TOP_PERFORMERS } from "@/constants/team";

const RANK_COLOR: Record<number, string> = {
  1: "bg-amber-500/20 text-amber-400",
  2: "bg-slate-500/20 text-slate-300",
  3: "bg-orange-500/20 text-orange-400",
};

export function TopPerformersCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Top Performers</h3>
        <button className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-300">
          This Month <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {TOP_PERFORMERS.map((p) => (
          <div key={p.rank} className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                RANK_COLOR[p.rank] ?? "bg-slate-800 text-slate-500"
              }`}
            >
              {p.rank}
            </span>
            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-700" />
            <span className="flex-1 truncate text-[12.5px] text-slate-200">{p.name}</span>
            <span className="text-[12.5px] font-semibold text-emerald-400">{p.score}%</span>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Leaderboard →
      </button>
    </div>
  );
}