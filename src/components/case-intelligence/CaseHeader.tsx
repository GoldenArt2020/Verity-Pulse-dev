"use client";

import { Share2, Bookmark, Sparkles, ChevronDown } from "lucide-react";

const TAGS = [
  { label: "Missing Person", color: "bg-blue-500/20 text-blue-400" },
  { label: "Institutional Failure", color: "bg-purple-500/20 text-purple-400" },
  { label: "Unresolved", color: "bg-slate-700 text-slate-300" },
];

export function CaseHeader() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-start gap-5">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-800" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">
              The Disappearance of Lana Purcell
            </h1>
            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Missing Person
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">London, UK &nbsp;|&nbsp; Jan 2011 &nbsp;|&nbsp; 27 years old</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Lana Purcell vanished in North London while walking to a nearby shop. Despite multiple
            appeals and a £20,000 reward, she has never been found.
          </p>
          <div className="mt-3 flex gap-2">
            {TAGS.map((t) => (
              <span key={t.label} className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${t.color}`}>
                {t.label}
              </span>
            ))}
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">+3</span>
          </div>
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

      <div className="mt-5 grid grid-cols-4 gap-4 border-t border-slate-800/60 pt-5">
        <div className="text-center">
          <p className="mb-1 text-[11px] text-slate-500">Opportunity Score</p>
          <div className="relative mx-auto h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3"
                strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.92)} strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">92</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-400">Excellent</p>
          <p className="text-[10px] text-slate-500">Top 8% of all opportunities</p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Search Trend (30D)</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">↑ 312%</p>
          <div className="mx-auto mt-1 h-8 w-24 rounded bg-slate-800/60" />
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">YouTube Coverage</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">Low</p>
          <p className="text-sm text-white">2.1 <span className="text-[11px] text-slate-500">/10</span></p>
          <p className="text-[10px] text-slate-500">Top 15% lowest</p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Competition Score</p>
          <p className="mt-1 text-xl font-semibold text-white">18 <span className="text-[11px] font-normal text-slate-500">/100</span></p>
          <p className="text-[11px] font-medium text-emerald-400">Very Low</p>
        </div>
      </div>
    </div>
  );
}