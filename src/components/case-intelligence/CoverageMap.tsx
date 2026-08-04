// src/components/case-intelligence/CoverageMap.tsx
"use client";

import type { CoverageMapItem } from "@/services/coverageAnalysis";

export function CoverageMap({ data, loading }: { data: CoverageMapItem[] | null; loading: boolean }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <h3 className="text-lg font-semibold text-[#FAFAFA]">Coverage Map</h3>
      <p className="mt-1 text-sm text-[#A1A1AA]">What YouTube has already covered.</p>

      {loading && <div className="mt-5 h-32 animate-pulse rounded-xl bg-white/[0.03]" />}

      {!loading && (!data || data.length === 0) && (
        <p className="mt-5 text-sm text-[#71717A]">No coverage data yet.</p>
      )}

      {!loading && data && data.length > 0 && (
        <div className="mt-5 space-y-3">
          {data.map((item) => (
            <div key={item.angle}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#FAFAFA]">{item.angle}</span>
                <span className="font-semibold text-[#A1A1AA]">{item.coverage}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.coverage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}