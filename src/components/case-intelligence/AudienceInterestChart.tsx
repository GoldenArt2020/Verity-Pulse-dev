"use client";

import { TrendingUp } from "lucide-react";

/**
 * No time-series audience-interest data source exists anywhere in the
 * pipeline yet (no historical search-trend tracking per case). Rather
 * than fabricate a fake growth curve, this shows an honest empty state
 * until that data source is actually built.
 */
export function AudienceInterestChart() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Audience Interest Over Time</h3>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-2 py-6 text-center">
        <TrendingUp className="h-6 w-6 text-slate-600" />
        <p className="text-xs text-slate-500">
          Interest tracking isn&apos;t available for this case yet.
        </p>
      </div>
    </div>
  );
}