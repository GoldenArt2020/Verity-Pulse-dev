"use client";

import { PROGRESS_OVERVIEW_BARS } from "@/constants/projects";

export function ProgressOverviewChart() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-[13px] font-semibold text-foreground">Progress Overview</h3>
      <p className="text-[10.5px] text-muted-foreground">Average progress by project status</p>

      <div className="mt-4 flex h-32 items-end justify-between gap-3 px-1">
        {PROGRESS_OVERVIEW_BARS.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10.5px] font-semibold text-foreground/80">{bar.pct}%</span>
            <div className="flex h-24 w-full items-end rounded-lg bg-muted">
              <div
                className={`w-full rounded-lg ${bar.color}`}
                style={{ height: `${bar.pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{bar.label}</span>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-brand hover:opacity-80">
        View Progress Report →
      </button>
    </div>
  );
}