"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, Loader2, ExternalLink } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";
import { ScriptLengthDialog } from "@/components/shared/ScriptLengthDialog";
import { ScriptPreviewModal } from "@/components/discover/scripts/ScriptPreviewModal";
import type { ScriptWordCount } from "@/constants/scriptOptions";
import type { ScriptSeoSummary } from "@/services/scriptWriter";

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
  onScriptGenerated: (
    angleId: string,
    script: string,
    wordCount: number,
    seo: { description: string; keywords: string[] } | null
  ) => void;
}) {
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<{ script: string; wordCount: number; seo: ScriptSeoSummary | null } | null>(
    null
  );
  const [openingProject, setOpeningProject] = useState(false);

  async function handleWriteScript(wordCount: ScriptWordCount) {
    if (!angle) return;
    setWriting(true);
    setWriteError(null);
    setDialogOpen(false);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: angle.id, caseId, wordCount, seo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate script");
      onScriptGenerated(angle.id, data.script, data.wordCount ?? wordCount, data.seo ?? null);
      setPreview({ script: data.script, wordCount: data.wordCount ?? wordCount, seo: data.seo ?? null });
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      setWriting(false);
    }
  }

  function handleReopenScript() {
    if (!angle?.script) return;
    const wordCount = angle.scriptWordCount ?? angle.script.trim().split(/\s+/).filter(Boolean).length;
    setPreview({
      script: angle.script,
      wordCount,
      seo: angle.seo ? { description: angle.seo.description ?? "", keywords: angle.seo.tags ?? [] } : null,
    });
  }

  async function handleOpenInProject() {
    if (!angle) return;
    setOpeningProject(true);
    setWriteError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, status: "NARRATIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open project");
      setPreview(null);
      router.push(`/projects/${data.id}?angle=${angle.id}`);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to open project");
    } finally {
      setOpeningProject(false);
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
        <div className="mt-6 flex flex-col items-center py-8 text-center">
          <Sparkles className="h-6 w-6 text-slate-600" />
          <p className="mt-3 text-xs text-slate-500">Select an angle from the list to see details here.</p>
        </div>
      )}

      {angle && (
        <>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                {totalScore(angle)}
              </div>
              <h4 className="text-sm font-semibold text-white">{angle.title}</h4>
            </div>
            <p className="mt-2 text-xs italic leading-relaxed text-slate-500">{angle.coreQuestion}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{angle.whyItWorks}</p>
          </div>

          {angle.researchFocus?.length > 0 && (
            <>
              <p className="mt-5 text-xs font-semibold text-slate-300">Research Focus</p>
              <ul className="mt-2 space-y-1.5">
                {angle.researchFocus.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-snug text-slate-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}

          {angle.openingHook && (
            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-[11px] font-semibold text-blue-400">Opening Hook</p>
              <p className="mt-1 text-xs italic leading-relaxed text-slate-300">{angle.openingHook}</p>
            </div>
          )}

          {angle.channelFit && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-300">Channel Fit</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{angle.channelFit}</p>
            </div>
          )}

          {angle.whyWorkOnIt && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-300">Why Work On This Now</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{angle.whyWorkOnIt}</p>
            </div>
          )}

          {angle.curiosityGaps?.length > 0 && (
            <>
              <p className="mt-5 text-xs font-semibold text-slate-300">Curiosity Gaps</p>
              <ul className="mt-2 space-y-1.5">
                {angle.curiosityGaps.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-snug text-slate-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}

          {angle.latestFindings?.length > 0 && (
            <>
              <p className="mt-5 text-xs font-semibold text-slate-300">Latest Findings</p>
              <ul className="mt-2 space-y-2">
                {angle.latestFindings.map((f, i) => (
                  <li key={i} className="text-xs leading-snug text-slate-400">
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"
                      >
                        {f.title} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-medium text-slate-300">{f.title}</span>
                    )}
                    {f.snippet && <p className="mt-0.5 text-slate-500">{f.snippet}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-5">
            {writeError && !preview && <p className="mb-2 text-xs text-rose-400">{writeError}</p>}
            {angle.script ? (
              <button
                onClick={handleReopenScript}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-950/40"
              >
                <FileText className="h-3.5 w-3.5" /> Script ready — view
              </button>
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

      {preview && (
        <ScriptPreviewModal
          script={preview.script}
          wordCount={preview.wordCount}
          seo={preview.seo}
          primaryLabel="Open in Project"
          primaryLoading={openingProject}
          primaryError={writeError}
          onPrimaryAction={handleOpenInProject}
          onClose={() => {
            setPreview(null);
            setWriteError(null);
          }}
        />
      )}
    </div>
  );
}