"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, FileText, Loader2 } from "lucide-react";
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
  caseId,
  onScriptGenerated,
}: {
  angles: GeneratedAngle[];
  loading: boolean;
  error: string | null;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRegenerate: () => void;
  caseId: string;
  onScriptGenerated: (originalIndex: number, script: string) => void;
}) {
  const [writingId, setWritingId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  const ranked = angles
    .map((angle, originalIndex) => ({ angle, originalIndex }))
    .sort((a, b) => totalScore(b.angle) - totalScore(a.angle));

  async function handleWriteScript(angle: GeneratedAngle, originalIndex: number) {
    setWritingId(angle.id);
    setWriteError(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: angle.id, caseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate script");
      onScriptGenerated(originalIndex, data.script);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      setWritingId(null);
    }
  }

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
          {writeError && <p className="text-xs text-rose-400">{writeError}</p>}
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

                <div className="mt-2 flex items-center justify-end">
                  {angle.script ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <FileText className="h-3.5 w-3.5" /> Script ready
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWriteScript(angle, originalIndex);
                      }}
                      disabled={writingId === angle.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
                    >
                      {writingId === angle.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Write Script
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}