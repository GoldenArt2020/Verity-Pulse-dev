"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

function totalScore(a: GeneratedAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function SelectedAnglePanel({
  angle,
  caseId,
  onClear,
}: {
  angle: GeneratedAngle | null;
  caseId: string;
  onClear: () => void;
}) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSaveToProjects() {
    if (saveState === "saving") return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save project");
      setSaveState("saved");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save project");
    }
  }

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

          <button
            onClick={handleSaveToProjects}
            disabled={saveState === "saving" || saveState === "saved"}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveState === "saved" && <Check className="h-4 w-4" />}
            {saveState === "saved"
              ? "Saved to Projects"
              : saveState === "saving"
                ? "Saving..."
                : saveState === "error"
                  ? "Retry Save to Projects"
                  : "Save to Projects"}
          </button>
          {saveError && <p className="mt-2 text-[11px] text-rose-400">{saveError}</p>}
        </>
      )}
    </div>
  );
}