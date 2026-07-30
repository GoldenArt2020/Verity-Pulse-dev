"use client";

import { WORKLOAD_DISTRIBUTION } from "@/constants/team";

export function WorkloadDistributionCard() {
  const total = 47;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Workload Distribution</h3>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="14" />
            {WORKLOAD_DISTRIBUTION.map((d) => {
              const dash = (d.pct / 100) * circumference;
              const el = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-cumulative}
                  strokeLinecap="butt"
                />
              );
              cumulative += dash;
              return el;
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[10px] text-slate-500">Total Tasks</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {WORKLOAD_DISTRIBUTION.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-[11.5px]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-slate-400">{d.label}</span>
              <span className="font-medium text-slate-300">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Full Workload →
      </button>
    </div>
  );
}