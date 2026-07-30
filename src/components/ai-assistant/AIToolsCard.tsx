"use client";

import { Sparkles, FileSearch, PenLine, Wand2 } from "lucide-react";

const TOOLS = [
  { icon: FileSearch, label: "Summarize Case", desc: "Condense research into a briefing" },
  { icon: PenLine, label: "Draft Title Ideas", desc: "Generate SEO-ready titles" },
  { icon: Wand2, label: "Suggest Narrative Angle", desc: "Find an overlooked story" },
  { icon: Sparkles, label: "Polish Script", desc: "Tighten pacing and clarity" },
];

export function AIToolsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">AI Tools</h3>
      <div className="mt-3 space-y-1">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-slate-800/40"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[12.5px] font-medium text-slate-200">{t.label}</p>
                <p className="text-[11px] text-slate-500">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}