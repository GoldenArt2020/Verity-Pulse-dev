"use client";

import { STORAGE_USAGE } from "@/constants/settings";

export function StorageUsageCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Storage Usage</h3>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-white">
          {STORAGE_USAGE.used} / {STORAGE_USAGE.total}
        </span>
        <span className="text-[11px] text-slate-500">{STORAGE_USAGE.pct}% Used</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${STORAGE_USAGE.pct}%` }} />
      </div>

      <div className="mt-3 space-y-1.5">
        {STORAGE_USAGE.breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-[11.5px]">
            <span className={`h-2 w-2 shrink-0 rounded-full ${b.color}`} />
            <span className="flex-1 text-slate-400">{b.label}</span>
            <span className="text-slate-300">{b.size}</span>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        Manage Storage
      </button>
    </div>
  );
}