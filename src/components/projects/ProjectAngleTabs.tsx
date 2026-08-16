"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, FileText, Check } from "lucide-react";
import { StepTabs } from "@/components/angle-builder/StepTabs";
import { ScriptLengthDialog } from "@/components/shared/ScriptLengthDialog";
import { ScriptPreviewModal } from "@/components/discover/scripts/ScriptPreviewModal";
import type { ScriptWordCount } from "@/constants/scriptOptions";

interface AngleScores {
  searchDemand: number;
  competition: number;
  emotionalImpact: number;
  originality: number;
  audienceMatch: number;
}

interface ProjectAngle {
  id: string;
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
  script: string | null;
  scriptGeneratedAt: string | null;
  scriptWordCount?: number | null;
}

interface ScriptSeoSummary {
  keywords: string[];
  description: string;
}

function totalScore(a: ProjectAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function ProjectAngleTabs({ caseId }: { caseId: string }) {
  const [requestedAngleId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("angle");
  });

  const [angles, setAngles] = useState<ProjectAngle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [writingId, setWritingId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [seoByAngle, setSeoByAngle] = useState<Record<string, ScriptSeoSummary>>({});

  // Which step of the workflow is highlighted. Jumps to "Analyze & Refine"
  // automatically the moment a script finishes generating.
  const [step, setStep] = useState(0);

  // The script that just finished (or was reopened) — drives the preview modal.
  const [preview, setPreview] = useState<{ script: string; wordCount: number; seo: ScriptSeoSummary | null } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    fetch(`/api/case/${caseId}/angles`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load angles");
        if (active) {
          const loaded: ProjectAngle[] = data.angles ?? [];
          setAngles(loaded);
          const preferred =
            requestedAngleId && loaded.some((a) => a.id === requestedAngleId)
              ? requestedAngleId
              : loaded[0]?.id ?? null;
          setActiveId(preferred);
          const preferredAngle = loaded.find((a) => a.id === preferred);
          if (preferredAngle?.script) setStep(1);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load angles");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const activeAngle = angles.find((a) => a.id === activeId) ?? null;

  /**
   * Drives a script job through /section calls until it's done writing,
   * then finalizes it via /finish. Same job-based flow as SelectedAnglePanel
   * — there is no synchronous single-call script endpoint.
   */
  async function runJobToCompletion(jobId: string, totalSections: number) {
    let sectionsCompleted = 0;
    let status: "writing" | "seo" | "complete" | "failed" = "writing";

    while (status === "writing") {
      setProgress(`Writing section ${sectionsCompleted + 1} of ${totalSections}...`);
      const res = await fetch("/api/generate-script/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to write next section");
      status = data.status;
      sectionsCompleted = data.sectionsCompleted;
    }

    setProgress("Finalizing script and SEO metadata...");
    const finishRes = await fetch("/api/generate-script/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const finishData = await finishRes.json();
    if (!finishRes.ok) throw new Error(finishData.error ?? "Failed to finalize script");
    return finishData as { script: string; wordCount: number; seo: ScriptSeoSummary | null };
  }

  async function handleWriteScript(wordCount: ScriptWordCount) {
    setDialogOpen(false);
    if (!activeAngle) return;
    setWritingId(activeAngle.id);
    setWriteError(null);
    try {
      setProgress("Researching the case...");
      const startRes = await fetch("/api/generate-script/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: activeAngle.id, caseId, wordCount }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error ?? "Failed to start script generation");

      const result = await runJobToCompletion(startData.jobId, startData.totalSections);
      const finalWordCount = result.wordCount ?? wordCount;

      setAngles((prev) =>
        prev.map((a) =>
          a.id === activeAngle.id
            ? { ...a, script: result.script, scriptGeneratedAt: new Date().toISOString(), scriptWordCount: finalWordCount }
            : a
        )
      );
      if (result.seo) {
        setSeoByAngle((prev) => ({ ...prev, [activeAngle.id]: result.seo as ScriptSeoSummary }));
      }
      // Script is ready to review — open it, then move the workflow into
      // Analyze & Refine.
      setPreview({ script: result.script, wordCount: finalWordCount, seo: result.seo ?? null });
      setStep(1);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to write script");
    } finally {
      setWritingId(null);
      setProgress(null);
    }
  }

  function handleReopenScript(angle: ProjectAngle) {
    if (!angle.script) return;
    const wordCount = angle.scriptWordCount ?? angle.script.trim().split(/\s+/).filter(Boolean).length;
    setPreview({ script: angle.script, wordCount, seo: seoByAngle[angle.id] ?? null });
  }

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return <p className="mt-10 text-sm text-rose-400">Couldn&apos;t load angles: {error}</p>;
  }

  if (angles.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/30 p-8 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-slate-600" />
        <p className="mt-2 text-sm text-slate-500">
          No angles yet for this case. Build angles from the Angle Builder to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <StepTabs active={step} onChange={setStep} />

      <p className="mt-4 text-xs text-slate-500">Angles</p>
      <div className="mt-2 flex flex-wrap gap-2 border-b border-slate-800/60 pb-3">
        {angles.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveId(a.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              a.id === activeId ? "bg-blue-500/15 text-blue-400" : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
            }`}
          >
            {a.title.length > 40 ? `${a.title.slice(0, 40)}...` : a.title}
            {a.script && <Check className="ml-1.5 inline h-3 w-3 text-emerald-400" />}
          </button>
        ))}
      </div>

      {activeAngle && (
        <div className="mt-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-500 text-sm font-bold text-emerald-400">
              {totalScore(activeAngle)}
            </div>
            <p className="flex-1 text-base font-semibold text-white">{activeAngle.title}</p>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-400">Core Question</p>
          <p className="mt-1 text-sm italic leading-relaxed text-slate-300">{activeAngle.coreQuestion}</p>

          <p className="mt-3 text-xs font-medium text-slate-400">Research Focus</p>
          <ul className="mt-1.5 space-y-1">
            {activeAngle.researchFocus.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[13px] text-slate-300">
                <span className="mt-0.5 text-emerald-400">✓</span> {r}
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-slate-800/60 pt-4">
            {!activeAngle.script && writingId !== activeAngle.id && (
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
              >
                <FileText className="h-4 w-4" />
                Write Script
              </button>
            )}

            {writingId === activeAngle.id && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress ?? "Researching & writing script — longer scripts can take a few minutes..."}
              </div>
            )}

            {writeError && <p className="mt-2 text-xs text-rose-400">{writeError}</p>}

            {activeAngle.script && writingId !== activeAngle.id && (
              <button
                onClick={() => handleReopenScript(activeAngle)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-950/40"
              >
                <FileText className="h-3.5 w-3.5" /> Script ready — view
              </button>
            )}
          </div>
        </div>
      )}

      <ScriptLengthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleWriteScript} busy={!!writingId} />

      {preview && (
        <ScriptPreviewModal
          script={preview.script}
          wordCount={preview.wordCount}
          seo={preview.seo}
          primaryLabel="Close & keep editing here"
          primaryError={writeError}
          onPrimaryAction={() => setPreview(null)}
          onRewrite={() => setDialogOpen(true)}
          rewriting={!!writingId}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}