"use client";

import { Bookmark, Skull, Snowflake, MoreHorizontal } from "lucide-react";
import { TOP_CATEGORY_BREAKDOWN } from "@/constants/savedCases";

const ICONS = [Bookmark, Skull, Snowflake, MoreHorizontal];
const ICON_COLORS = [
  "bg-blue-500/15 text-blue-400",
  "bg-rose-500/15 text-rose-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-slate-500/15 text-slate-400",
];

export function TopCategoryBreakdown() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Top Category Breakdown</h3>

      <div className="mt-3 space-y-3">
        {TOP_CATEGORY_BREAKDOWN.map((c, idx) => {
          const Icon = ICONS[idx];
          return (
            <div key={c.label} className="flex items-center gap-2.5">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ICON_COLORS[idx]}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="truncate text-slate-300">{c.label}</span>
                  <span className="text-slate-500">{c.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View All Categories →
      </button>
    </div>
  );
}