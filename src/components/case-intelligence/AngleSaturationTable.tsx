"use client";

import type { AngleSaturationRow } from "@/services/coverageAnalysis";

export function AngleSaturationTable({ data, loading }: { data: AngleSaturationRow[] | null; loading: boolean }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <h3 className="text-lg font-semibold text-[#FAFAFA]">Angle Saturation</h3>

      {loading && <div className="mt-5 h-32 animate-pulse rounded-xl bg-white/[0.03]" />}

      {!loading && (!data || data.length === 0) && (
        <p className="mt-5 text-sm text-[#71717A]">No saturation data yet.</p>
      )}

      {!loading && data && data.length > 0 && (
        <div className="mt-5 space-y-1">
          <div className="grid grid-cols-3 gap-3 pb-2 text-xs font-medium text-[#71717A]">
            <span>Angle</span>
            <span className="text-center">Coverage</span>
            <span className="text-center">Opportunity</span>
          </div>
          {data.map((row) => (
            <div key={row.angle} className="grid grid-cols-3 gap-3 border-t border-white/[0.06] py-3 text-sm">
              <span className="text-[#FAFAFA]">{row.angle}</span>
              <span className="text-center text-[#A1A1AA]">{row.coverage}%</span>
              <span className="text-center font-semibold text-emerald-400">{row.opportunity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}