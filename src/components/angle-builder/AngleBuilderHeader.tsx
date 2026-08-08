"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Sparkles, Loader2, ChevronDown, Info } from "lucide-react";
import type { CaseRow } from "@/hooks/useCase";
import { useChannelDNA } from "@/hooks/useChannelDNA";
import { useChannelId } from "@/hooks/useChannelId";
import { personalizeCaseScore } from "@/lib/personalizeCaseScore";

type SaveState = "idle" | "saving" | "saved" | "error";

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="text-slate-600 hover:text-slate-400"
        aria-label="More info"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-[11px] font-normal leading-snug text-slate-300 shadow-xl">
          {text}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-slate-700 bg-slate-900" />
        </span>
      )}
    </span>
  );
}

export function AngleBuilderHeader({
  caseData,
  onRegenerate,
  regenerating,
}: {
  caseData: CaseRow;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { channelHandle } = useChannelId();
  const { dna, loading: dnaLoading } = useChannelDNA();

  const scores = personalizeCaseScore(
    {
      opportunityScore: caseData.opportunity_score,
      competitionScore: caseData.competition_score,
      coverageScore: caseData.coverage_score,
      caseTypeTags: caseData.tags ?? [],
      country: caseData.country,
    },
    dna
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSave(bucket: "ongoing" | "finished") {
    setMenuOpen(false);
    setSaveState("saving");
    setSaveError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.id,
          status: bucket === "ongoing" ? "IDEA" : "PUBLISHED",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save project");
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save project");
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-start gap-5">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-800" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">{caseData.name}</h1>
            {caseData.category && (
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                {caseData.category}
              </span>
            )}
          </div>
          {caseData.country && <p className="mt-1 text-xs text-slate-500">{caseData.country}</p>}
          {caseData.summary && <p className="mt-2 max-w-2xl text-sm text-slate-400">{caseData.summary}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => saveState !== "saved" && setMenuOpen((o) => !o)}
              disabled={saveState === "saving"}
              title={saveError ?? undefined}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
            >
              {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saveState === "saved" && <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />}
              {(saveState === "idle" || saveState === "error") && <Bookmark className="h-3.5 w-3.5" />}
              {saveState === "saved"
                ? "Saved"
                : saveState === "saving"
                  ? "Saving..."
                  : saveState === "error"
                    ? "Retry Save"
                    : "Save Project"}
              {saveState !== "saved" && <ChevronDown className="h-3 w-3" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                <button
                  onClick={() => handleSave("ongoing")}
                  className="flex w-full items-center px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  Save as Ongoing
                </button>
                <button
                  onClick={() => handleSave("finished")}
                  className="flex w-full items-center px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  Save as Finished
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {regenerating ? "Generating..." : "Generate More Angles"}
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800/60 pt-3">
        <p className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-600">
          {dnaLoading
            ? "Loading channel profile…"
            : scores.isPersonalized
                ? `Personalized for ${channelHandle ?? "your channel"}`
              : "General score — connect a channel to personalize"}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="mb-1 flex items-center justify-center gap-1 text-[11px] text-slate-500">
              Opportunity Score
              <InfoTooltip text="How strong a fit this case is for the connected channel specifically — blends the case's overall documentary strength with how well its case type and region match this channel's proven audience. Higher is better." />
            </p>
            <div className="relative mx-auto h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3"
                  strokeDasharray="97.4"
                  strokeDashoffset={97.4 * (1 - scores.opportunityScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                {scores.opportunityScore}
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              YouTube Coverage
              <InfoTooltip text="A 0–10 estimate of how much true-crime documentary coverage this case already has on YouTube overall. This is a market-wide fact, so it doesn't change per channel — lower means the story is fresher." />
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {scores.coverageScore != null ? `${scores.coverageScore}/10` : "—"}
            </p>
          </div>

          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              Competition Score
              <InfoTooltip text="0–100 estimate of how saturated this case is, adjusted for the connected channel's niche. If most existing coverage sits outside this channel's proven case-type strength, the effective competition for this channel is shown as lower than the raw global number." />
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {scores.competitionScore} <span className="text-[11px] font-normal text-slate-500">/100</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}