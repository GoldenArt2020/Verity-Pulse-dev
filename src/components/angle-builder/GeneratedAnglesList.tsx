// src/components/angle-builder/GeneratedAnglesList.tsx
"use client";

import { Sparkles, Check } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

function totalScore(a: GeneratedAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function GeneratedAnglesList({
  angles,
  loading,
  error,
  selectedIndex,
  onSelect,
  onRegenerate,
}: {
  angles: GeneratedAngle[];
  loading: boolean;
  error: string | null;
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Generated Narrative Angles ({angles.length})</h3>
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/30" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && angles.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-slate-500">No angles generated yet.</p>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white"
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate Angles
          </button>
        </div>
      )}

      {!loading && !error && angles.length > 0 && (
        <div className="mt-3 space-y-2">
          {angles.map((a, i) => {
            const isSelected = selectedIndex === i;
            return (
              <div
                key={a.title}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(i)}
                className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/40"
                    : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected ? "border-blue-500 bg-blue-500" : "border-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                    {totalScore(a)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white">{a.title}</p>
                    <p className="mt-1 text-[11px] italic leading-snug text-slate-500">{a.coreQuestion}</p>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{a.whyItWorks}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}