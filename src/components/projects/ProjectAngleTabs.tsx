"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, FileText, Check } from "lucide-react";
import { StepTabs } from "@/components/angle-builder/StepTabs";
import { ScriptLengthDialog } from "@/components/shared/ScriptLengthDialog";
import { ScriptPreviewModal } from "@/components/discover/scripts/ScriptPreviewModal";
import { TitleSuggestionsPanel } from "@/components/projects/TitleSuggestionsPanel";
import { DescriptionCreatorPanel } from "@/components/projects/DescriptionCreatorPanel";
import { TagCreationPanel } from "@/components/projects/TagCreationPanel";
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

interface ScriptPreview {
  script: string;
  wordCount: number;
}

function totalScore(a: ProjectAngle) {
  const s = a.scores;
  return s.searchDemand + s.competition + s.emotionalImpact + s.originality + s.audienceMatch;
}

export function ProjectAngleTabs({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [requestedAngleId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("angle");
  });

  const [angles, setAngles] = useState<ProjectAngle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  // Which angle is currently generating (null when nothing's in flight).
  // A ref, not just state, because the poll loop below is an async
  // function that needs to check the LATEST value at each iteration —
  // state captured in a closure would go stale across awaits.
  const [writingAngleId, setWritingAngleId] = useState<string | null>(null);
  const writingAngleRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<ScriptPreview | null>(null);

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
  const writingActiveAngle = writingAngleId === activeId;

  async function handleWriteScript(wordCount: ScriptWordCount) {
    setDialogOpen(false);
    if (!activeAngle) return;
    const forAngleId = activeAngle.id;
    setWriteError(null);
    setWritingAngleId(forAngleId);
    writingAngleRef.current = forAngleId;

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: forAngleId, caseId, wordCount, idempotencyKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to start script generation");

      let result: { status: string; script?: string; wordCount?: number; error?: string };
      do {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const statusRes = await fetch(`/api/scripts/status/${data.runId}`);
        result = await statusRes.json();
        if (!statusRes.ok) throw new Error(result.error ?? "Failed to check generation status");
      } while (result.status === "in_progress");

      if (result.status === "failed") throw new Error(result.error ?? "Script generation failed");
      if (result.status !== "complete" || !result.script) throw new Error("Script generation returned no script");

      const finalWordCount = result.wordCount ?? wordCount;
      setAngles((prev) =>
        prev.map((a) =>
          a.id === forAngleId
            ? { ...a, script: result.script!, scriptGeneratedAt: new Date().toISOString(), scriptWordCount: finalWordCount }
            : a
        )
      );
      setStep(1);
      if (writingAngleRef.current === forAngleId) {
        setPreview({ script: result.script, wordCount: finalWordCount });
      }
      try {
        const projectRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, status: "NARRATIVE" }),
        });
        const projectData = await projectRes.json();
        if (projectRes.ok) {
          router.push(`/projects/${projectData.id}?tab=ongoing&angle=${forAngleId}&stage=analyze-refine`);
        }
      } catch {
        // The script remains available in the preview if navigation fails.
      }
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      if (writingAngleRef.current === forAngleId) {
        writingAngleRef.current = null;
        setWritingAngleId(null);
      }
    }
  }

  function handleReopenScript(angle: ProjectAngle) {
    if (!angle.script) return;
    const wordCount = angle.scriptWordCount ?? angle.script.trim().split(/\s+/).filter(Boolean).length;
    setPreview({ script: angle.script, wordCount });
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

      {(step === 0 || step === 1) && activeAngle && (
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
            {!activeAngle.script && !writingActiveAngle && (
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
              >
                <FileText className="h-4 w-4" />
                Write Script
              </button>
            )}

            {writingActiveAngle && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Writing your script — this can take a few minutes for longer scripts...
              </div>
            )}

            {writeError && <p className="mt-2 text-xs text-rose-400">{writeError}</p>}

            {activeAngle.script && !writingActiveAngle && (
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

      {step === 2 && activeAngle && <TitleSuggestionsPanel key={activeAngle.id} angleId={activeAngle.id} />}
      {step === 3 && activeAngle && <DescriptionCreatorPanel key={activeAngle.id} angleId={activeAngle.id} />}
      {step === 4 && activeAngle && <TagCreationPanel key={activeAngle.id} angleId={activeAngle.id} />}

      <ScriptLengthDialog
        open={dialogOpen}
        onClose={() => {
          if (!writingActiveAngle) setDialogOpen(false);
        }}
        onSelect={handleWriteScript}
        busy={writingActiveAngle}
      />

      {preview && (
        <ScriptPreviewModal
          script={preview.script}
          wordCount={preview.wordCount}
          seo={null}
          primaryLabel="Close & keep editing here"
          primaryError={writeError}
          onPrimaryAction={() => setPreview(null)}
          onRewrite={() => setDialogOpen(true)}
          rewriting={writingActiveAngle}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}