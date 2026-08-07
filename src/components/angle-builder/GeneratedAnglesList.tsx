"use client";

import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
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
  onSelect: (index: number) => void;
  onRegenerate: () => void;
}) {
  const ranked = angles
    .map((angle, originalIndex) => ({ angle, originalIndex }))
    .sort((a, b) => totalScore(b.angle) - totalScore(a.angle));

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Generated Narrative Angles ({angles.length})</h3>

      {loading && (
        <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <p className="text-xs text-slate-500">Generating angles...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-xl border border-rose-900/40 bg-rose-950/30 p-6 text-center">
          <p className="text-sm text-rose-400">{error}</p>
          <button
            onClick={onRegenerate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      )}

      {!loading && !error && angles.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
          <Sparkles className="h-5 w-5 text-slate-600" />
          <p className="text-xs text-slate-500">No angles yet.</p>
        </div>
      )}

      {!loading && !error && angles.length > 0 && (
        <div className="mt-4 space-y-2">
          {ranked.map(({ angle, originalIndex }) => {
            const selected = selectedIndex === originalIndex;
            const score = totalScore(angle);
            return (
              <div
                key={angle.id}
                onClick={() => onSelect(originalIndex)}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  selected
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-slate-800/60 bg-slate-900/30 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                    {score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{angle.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{angle.coreQuestion}</p>
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