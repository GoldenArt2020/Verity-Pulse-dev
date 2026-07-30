"use client";

import { Search, TrendingDown, Heart, Users, Sparkles, Pencil } from "lucide-react";

const WHY_ITEMS = [
  { icon: Search, label: "High Search Demand", value: "↑ 312%" },
  { icon: TrendingDown, label: "Low Competition", value: "Top 15% lowest" },
  { icon: Heart, label: "Strong Emotional Pull", value: "Mother + Victim" },
  { icon: Users, label: "Audience Alignment", value: "94% Match" },
];

const KEY_ELEMENTS = [
  { text: "Institutional failure and delayed police response", tag: "High Impact", color: "bg-rose-500/20 text-rose-400" },
  { text: "A young mother with her whole life ahead", tag: "Emotional Core", color: "bg-purple-500/20 text-purple-400" },
  { text: "Timeline gaps that raise serious questions", tag: "Suspense", color: "bg-amber-500/20 text-amber-400" },
  { text: "£20,000 reward and public frustration", tag: "Tension", color: "bg-rose-500/20 text-rose-400" },
  { text: "Unanswered questions that remain to this day", tag: "Open Loop", color: "bg-blue-500/20 text-blue-400" },
];

const FORMATS = [
  { label: "Documentary", score: 95 },
  { label: "Investigative Deep Dive", score: 90 },
  { label: "Explainer", score: 78 },
  { label: "Timeline Breakdown", score: 72 },
  { label: "News Retrospective", score: 61 },
];

export function SelectedAnglePanel() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Selected Angle</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">Clear Selection</button>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-500 text-sm font-bold text-emerald-400">
          91
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-white">The Case Police Ignored</p>
          <p className="mt-0.5 text-xs text-slate-400">
            How institutional failure and delayed response may have cost Lana Purcell her life.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-slate-500">Angle Potential</p>
          <p className="text-sm font-semibold text-emerald-400">↗ High</p>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">Why this angle works</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {WHY_ITEMS.map((w) => {
          const Icon = w.icon;
          return (
            <div key={w.label} className="rounded-xl border border-slate-800/60 p-2.5">
              <Icon className="h-3.5 w-3.5 text-blue-400" />
              <p className="mt-1 text-[10px] text-slate-500">{w.label}</p>
              <p className="text-xs font-semibold text-white">{w.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Key Narrative Elements</p>
          <div className="mt-2 space-y-2">
            {KEY_ELEMENTS.map((k) => (
              <div key={k.text} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="text-emerald-400">✓</span> {k.text}
                </span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${k.color}`}>
                  {k.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">Best Content Formats</p>
          <div className="mt-2 space-y-2.5">
            {FORMATS.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{f.label}</span>
                  <span className="text-slate-400">{f.score}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${f.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:scale-[1.01] active:scale-[0.98]">
          <Sparkles className="h-4 w-4" /> Use This Angle
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/50">
          <Pencil className="h-4 w-4" /> Refine This Angle
        </button>
      </div>
    </div>
  );
}