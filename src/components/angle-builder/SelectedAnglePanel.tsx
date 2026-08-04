// src/components/angle-builder/SelectedAnglePanel.tsx
"use client";

import { Sparkles } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

const LENS_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

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
            <div className="flex-1">
              <span className="inline-block rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                {LENS_LABELS[angle.lens] ?? angle.lens}
              </span>
              <p className="mt-1 text-lg font-semibold text-white">{angle.title}</p>
            </div>
          </div>

          <p className="mt-4 text-xs font-medium text-slate-400">Hook</p>
          <p className="mt-1 text-sm italic leading-relaxed text-slate-300">&quot;{angle.hook}&quot;</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Why this angle works</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{angle.rationale}</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Key Story Beats</p>
          <ul className="mt-1.5 space-y-1">
            {angle.keyBeats.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-[13px] text-slate-300">
                <span className="mt-0.5 text-emerald-400">✓</span> {b}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}