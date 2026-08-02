"use client";

import { PROJECTS_OVERVIEW_DONUT } from "@/constants/projects";

export function ProjectsOverviewDonut() {
  const total = PROJECTS_OVERVIEW_DONUT.reduce((sum, d) => sum + d.value, 0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-[13px] font-semibold text-foreground">Projects Overview</h3>

      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
          {PROJECTS_OVERVIEW_DONUT.map((d) => {
            const dash = (d.value / total) * circumference;
            const el = (
              <circle
                key={d.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-cumulative}
                strokeLinecap="butt"
              />
            );
            cumulative += dash;
            return el;
          })}
        </svg>

        <div className="flex-1 space-y-1.5">
          {PROJECTS_OVERVIEW_DONUT.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-[11.5px]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-muted-foreground">{d.label}</span>
              <span className="font-medium text-foreground/80">
                {d.value} ({d.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-brand hover:opacity-80">
        View Full Analytics →
      </button>
    </div>
  );
}