"use client";

import { CURRENT_USAGE } from "@/constants/billing";

export function CurrentUsageCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
      <h3 className="text-[14px] font-semibold text-white">Current Usage</h3>

      <div className="mt-4 space-y-4">
        {CURRENT_USAGE.map((u) => (
          <div key={u.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-400">{u.label}</span>
              <span className="font-medium text-slate-300">
                {u.value} {u.max ? `/ ${u.max}` : "/ Unlimited"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${u.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}