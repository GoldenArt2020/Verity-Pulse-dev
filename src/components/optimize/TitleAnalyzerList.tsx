"use client";

import { useState } from "react";

const TITLES = [
  { title: "The Disappearance of Lana Purcell: Police Neglect or Something Much Darker? | UK True Crime Documentary", tags: ["Institutional Failure", "Unsolved Mystery"], score: 91, label: "Excellent" },
  { title: "What Happened to Lana Purcell? The Case Police Ignored for Nearly 14 Years | UK True Crime", tags: ["Police Neglect", "Cold Case"], score: 88, label: "Very Good" },
  { title: "The Unsolved Disappearance of Lana Purcell: A Mother, A Daughter, and Too Many Questions", tags: ["Emotional", "Family Angle"], score: 85, label: "Very Good" },
  { title: "Lana Purcell Case: The Truth Behind Police Failures and a Vanishing Without a Trace", tags: ["Institutional Failure", "Investigative"], score: 83, label: "Very Good" },
  { title: "14 Years Without Answers: The Mysterious Disappearance of Lana Purcell | UK True Crime Documentary", tags: ["Long Timeline", "Unsolved"], score: 81, label: "Good" },
];

export function TitleAnalyzerList() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">1</span>
        <h3 className="text-base font-semibold text-white">Title Analyzer</h3>
        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Top Performer</span>
      </div>

      <div className="mt-3 space-y-2">
        {TITLES.map((t, i) => (
          <button
            key={t.title}
            onClick={() => setSelected(i)}
            className={`w-full rounded-xl border p-3 text-left transition-all ${
              selected === i ? "border-blue-500/60 bg-blue-500/10" : "border-slate-800/60 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selected === i} readOnly className="mt-1 h-3.5 w-3.5 rounded border-slate-600 accent-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-white">{t.title}</p>
                <div className="mt-1.5 flex gap-1.5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-emerald-400">{t.score}</p>
                <p className="text-[10px] text-slate-500">{t.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800/40">
        + Generate More Titles
      </button>
    </div>
  );
}