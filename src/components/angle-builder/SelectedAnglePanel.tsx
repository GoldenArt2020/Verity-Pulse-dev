"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, Loader2, ExternalLink } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";
import { ScriptLengthDialog } from "@/components/shared/ScriptLengthDialog";
import type { ScriptWordCount } from "@/constants/scriptOptions";

function totalScore(a: GeneratedAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function SelectedAnglePanel({
  angle,
  onClear,
  caseId,
  onScriptGenerated,
}: {
  angle: GeneratedAngle | null;
  onClear: () => void;
  caseId: string;
  onScriptGenerated: (angleId: string, script: string) => void;
}) {
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleWriteScript(wordCount: ScriptWordCount) {
    if (!angle) return;
    setWriting(true);
    setWriteError(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: angle.id, caseId, wordCount, seo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate script");
      onScriptGenerated(angle.id, data.script);
      setDialogOpen(false);
      router.push(`/projects/${caseId}?tab=ongoing&angle=${angle.id}&stage=analyze-refine`);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      setWriting(false);
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

          {angle.caseWriteup && (
            <>
              <p className="mt-4 text-xs font-medium text-slate-400">Case Writeup</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{angle.caseWriteup}</p>
            </>
          )}

          <p className="mt-4 text-xs font-medium text-slate-400">Core Question</p>
          <p className="mt-1 text-sm italic leading-relaxed text-slate-300">{angle.coreQuestion}</p>

          <p className="mt-4 text-xs font-medium text-slate-400">Opening Hook</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">&quot;{angle.openingHook}&quot;</p>

          {angle.channelFit && (
            <>
              <p className="mt-4 text-xs font-medium text-slate-400">Why This Fits Your Channel</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{angle.channelFit}</p>
            </>
          )}

          {angle.whyWorkOnIt && (
            <>
              <p className="mt-4 text-xs font-medium text-slate-400">Why Work On This Now</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{angle.whyWorkOnIt}</p>
            </>
          )}

          {angle.curiosityGaps.length > 0 && (
            <>
              <p className="mt-4 text-xs font-medium text-slate-400">Curiosity Gaps</p>
              <ul className="mt-1.5 space-y-1">
                {angle.curiosityGaps.map((g) => (
                  <li key={g} className="flex items-start gap-1.5 text-[13px] text-slate-300">
                    <span className="mt-0.5 text-amber-400">?</span> {g}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-4 text-xs font-medium text-slate-400">Research Focus</p>
          <ul className="mt-1.5 space-y-1">
            {angle.researchFocus.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[13px] text-slate-300">
                <span className="mt-0.5 text-emerald-400">✓</span> {r}
              </li>
            ))}
          </ul>

          {angle.latestFindings.length > 0 && (
            <>
              <p className="mt-4 text-xs font-medium text-slate-400">Latest Findings</p>
              <ul className="mt-1.5 space-y-2">
                {angle.latestFindings.map((f) => (
                  <li key={f.url} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2">
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-medium text-blue-400 hover:text-blue-300">
                      {f.title} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{f.snippet}</p>
                    {f.publishedDate && <p className="mt-0.5 text-[10px] text-slate-600">{f.publishedDate}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-5">
            {writeError && <p className="mb-2 text-xs text-rose-400">{writeError}</p>}
            {angle.script ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-400">
                <FileText className="h-3.5 w-3.5" /> Script ready
              </span>
            ) : (
              <button
                onClick={() => setDialogOpen(true)}
                disabled={writing}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {writing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                {writing ? "Writing..." : "Write Script"}
              </button>
            )}
          </div>
        </>
      )}

      <ScriptLengthDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleWriteScript}
        busy={writing}
      />
    </div>
  );
}