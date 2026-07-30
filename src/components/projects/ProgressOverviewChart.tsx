"use client";

import { PROGRESS_OVERVIEW_BARS } from "@/constants/projects";

export function ProgressOverviewChart() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Progress Overview</h3>
      <p className="text-[10.5px] text-slate-500">Average progress by project status</p>

      <div className="mt-4 flex h-32 items-end justify-between gap-3 px-1">
        {PROGRESS_OVERVIEW_BARS.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10.5px] font-semibold text-slate-300">{bar.pct}%</span>
            <div className="flex h-24 w-full items-end rounded-lg bg-slate-800/60">
              <div
                className={`w-full rounded-lg ${bar.color}`}
                style={{ height: `${bar.pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">{bar.label}</span>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Progress Report →
      </button>
    </div>
  );
}