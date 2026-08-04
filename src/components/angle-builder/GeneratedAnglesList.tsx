// src/components/angle-builder/GeneratedAnglesList.tsx
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
            <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/30" />
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
          {angles.map((a, i) => (
            <button
              key={a.title}
              onClick={() => onSelect(i)}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                selectedIndex === i
                  ? "border-blue-500/60 bg-blue-500/10"
                  : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedIndex === i} readOnly className="mt-1 h-3.5 w-3.5 rounded border-slate-600 accent-blue-500" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                  {totalScore(a)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                    {LENS_LABELS[a.lens] ?? a.lens}
                  </span>
                  <p className="mt-1 text-[13px] font-semibold text-white">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{a.rationale}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}