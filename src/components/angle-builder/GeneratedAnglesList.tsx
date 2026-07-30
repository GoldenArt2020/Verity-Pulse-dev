"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

const ANGLES = [
  { score: 91, title: "The Case Police Ignored", desc: "How institutional failure and delayed response may have cost Lana Purcell her life.", tags: ["Institutional Failure", "Police Neglect"], potential: "High Potential", potentialColor: "text-emerald-400" },
  { score: 89, title: "A Mother Vanishes", desc: "The heartbreaking story of a 27-year-old mother who disappeared without a trace.", tags: ["Emotional", "Mother"], potential: "High Potential", potentialColor: "text-emerald-400" },
  { score: 86, title: "Secrets in North London", desc: "Exploring the hidden dangers, missing pieces, and unanswered questions in Lana's neighborhood.", tags: ["Location Focus", "Unanswered Questions"], potential: "High Potential", potentialColor: "text-emerald-400" },
  { score: 84, title: "The £20,000 Question", desc: "Why a huge reward wasn't enough — and what it says about this complex case.", tags: ["Reward", "Mystery"], potential: "Medium Potential", potentialColor: "text-amber-400" },
  { score: 81, title: "Vanished Without a Trace", desc: "A deep dive into the timeline, evidence, and people connected to Lana Purcell's disappearance.", tags: ["Timeline", "Evidence Focus"], potential: "Medium Potential", potentialColor: "text-amber-400" },
];

export function GeneratedAnglesList() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Generated Narrative Angles (10)</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">Select All</button>
      </div>

      <div className="mt-3 space-y-2">
        {ANGLES.map((a, i) => (
          <button
            key={a.title}
            onClick={() => setSelected(i)}
            className={`w-full rounded-xl border p-3 text-left transition-all ${
              selected === i
                ? "border-blue-500/60 bg-blue-500/10"
                : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selected === i} readOnly className="mt-1 h-3.5 w-3.5 rounded border-slate-600 accent-blue-500" />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                {a.score}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">{a.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{a.desc}</p>
                <div className="mt-1.5 flex gap-1.5">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className={`text-[10px] font-medium ${a.potentialColor}`}>{a.potential}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800/40">
        Load More Angles ⌄
      </button>
    </div>
  );
}