// src/components/angle-builder/SelectedAnglePanel.tsx
"use client";

import { Sparkles } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

function totalScore(a: GeneratedAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function SelectedAnglePanel({ angle, onClear }: { angle: GeneratedAngle | null; onClear: () => void }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Selected Angle</h3>
        {angle && (
          <button onClick={onClear} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear Selection
          </button>
        )}
      </div>

      {!angle && (
        <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
          <Sparkles className="h-5 w-5 text-slate-600" />
          <p className="text-xs text-slate-500">Select an angle from the list to see details here.</p>
        </div>
      )}

      {angle && (
        <>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-500 text-sm font-bold text-emerald-400">
              {totalScore(angle)}
            </div>
            <p className="flex-1 text-lg font-semibold text-white">{angle.title}</p>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-400">Core Question</p>
          <p className="mt-1 text-sm italic leading-relaxed text-slate-300">{angle.coreQuestion}</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Opening Hook</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">&quot;{angle.openingHook}&quot;</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Why This Angle Works</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{angle.whyItWorks}</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Research Focus</p>
          <ul className="mt-1.5 space-y-1">
            {angle.researchFocus.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[13px] text-slate-300">
                <span className="mt-0.5 text-emerald-400">✓</span> {r}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}