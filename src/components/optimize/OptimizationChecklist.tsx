"use client";

import { CheckCircle2, Circle } from "lucide-react";

const CHECKLIST = [
  { label: "High performing title", done: true },
  { label: "Engaging thumbnail", done: true },
  { label: "SEO optimized description", done: true },
  { label: "Relevant tags (500)", done: true },
  { label: "Chapters added", done: true },
  { label: "End screens planned", done: true },
  { label: "Pinned comment planned", done: true },
  { label: "Cards added", done: true },
  { label: "Playlist selected", done: false },
];

export function OptimizationChecklist() {
  const done = CHECKLIST.filter((c) => c.done).length;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Optimization Checklist</h3>
        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
          {done}/{CHECKLIST.length}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {CHECKLIST.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            )}
            <span className="text-[11px] text-slate-300">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}