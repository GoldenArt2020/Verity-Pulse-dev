"use client";

import { COVERAGE_MAP } from "@/constants/coverageIntelligence";

export function CoverageMap({ caseId }: { caseId?: string }) {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <h3 className="text-lg font-semibold text-[#FAFAFA]">Coverage Map</h3>
      <p className="mt-1 text-sm text-[#A1A1AA]">What YouTube has already covered.</p>

      <div className="mt-5 space-y-3">
        {COVERAGE_MAP.map((item) => (
          <div key={item.angle}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#FAFAFA]">{item.angle}</span>
              <span className="font-semibold text-[#A1A1AA]">{item.coverage}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${item.coverage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}