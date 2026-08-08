"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, FileText, Copy, Check, RotateCcw } from "lucide-react";
import { ScriptLengthDialog } from "@/components/shared/ScriptLengthDialog";
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
  // Reads ?angle=<id> from the URL without needing a Suspense boundary
  // (useSearchParams would require one; this component isn't wrapped in one).
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
  const [copied, setCopied] = useState(false);
  const [seoByAngle, setSeoByAngle] = useState<Record<string, ScriptSeoSummary>>({});

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

  async function handleWriteScript(wordCount: ScriptWordCount) {
    setDialogOpen(false);
    if (!activeAngle) return;
    setWritingId(activeAngle.id);
    setWriteError(null);
    try {
      const res = await fetch("/api/case/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: activeAngle.id, caseId, wordCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to write script");
      setAngles((prev) =>
        prev.map((a) =>
          a.id === activeAngle.id ? { ...a, script: data.script, scriptGeneratedAt: new Date().toISOString() } : a
        )
      );
      if (data.seo) {
        setSeoByAngle((prev) => ({ ...prev, [activeAngle.id]: data.seo }));
      }
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to write script");
    } finally {
      setWritingId(null);
    }
  }

  async function handleCopy(script: string) {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  const activeSeo = activeAngle ? seoByAngle[activeAngle.id] : undefined;

  return (
    <div className="mt-10">
      <p className="text-xs text-slate-500">Angles</p>

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
                Researching &amp; writing script — longer scripts can take a few minutes...
              </div>
            )}

            {writeError && <p className="mt-2 text-xs text-rose-400">{writeError}</p>}

            {activeAngle.script && writingId !== activeAngle.id && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">
                    Script
                    {activeAngle.scriptGeneratedAt && (
                      <span className="ml-2 text-slate-600">
                        Generated {new Date(activeAngle.scriptGeneratedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => handleCopy(activeAngle.script!)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
                  {activeAngle.script}
                </div>

                {activeSeo && (
                  <div className="mt-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
                    <p className="text-[11px] font-medium text-slate-400">SEO Snapshot (for your video upload)</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activeSeo.keywords.map((k) => (
                        <span key={k} className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{activeSeo.description}</p>
                  </div>
                )}

                <button
                  onClick={() => setDialogOpen(true)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rewrite script
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ScriptLengthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleWriteScript} />
    </div>
  );
}