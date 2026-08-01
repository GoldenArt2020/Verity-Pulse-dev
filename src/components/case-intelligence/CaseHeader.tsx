"use client";

import { Share2, Bookmark, Sparkles, ChevronDown } from "lucide-react";
import type { CaseRow } from "@/hooks/useCase";

export function CaseHeader({ caseData }: { caseData: CaseRow }) {
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
          {caseData.country && (
            <p className="mt-1 text-xs text-slate-500">{caseData.country}</p>
          )}
          {caseData.summary && (
            <p className="mt-2 max-w-2xl text-sm text-slate-400">{caseData.summary}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
            <Bookmark className="h-3.5 w-3.5" /> Save Case
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="h-3.5 w-3.5" /> Generate Angle <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-800/60 pt-5">
        <div className="text-center">
          <p className="mb-1 text-[11px] text-slate-500">Opportunity Score</p>
          <div className="relative mx-auto h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="97.4"
                strokeDashoffset={97.4 * (1 - (caseData.opportunity_score ?? 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
              {caseData.opportunity_score ?? "—"}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">YouTube Coverage</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {caseData.coverage_score != null ? `${caseData.coverage_score}/10` : "—"}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Competition Score</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {caseData.competition_score ?? "—"}{" "}
            <span className="text-[11px] font-normal text-slate-500">/100</span>
          </p>
        </div>
      </div>
    </div>
  );
}