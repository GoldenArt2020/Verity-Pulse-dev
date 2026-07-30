"use client";

import { ChevronRight } from "lucide-react";

const GAPS = [
  { n: "01", title: "Police Delay & Institutional Failure", desc: "The slow police response and missed opportunities have not been fully explored.", potential: "High Potential", potentialColor: "bg-emerald-500/20 text-emerald-400", score: 94 },
  { n: "02", title: "Timeline Reconstruction", desc: "A detailed hour-by-hour reconstruction of Lana's last known movements.", potential: "High Potential", potentialColor: "bg-emerald-500/20 text-emerald-400", score: 91 },
  { n: "03", title: "Life Beyond the Headlines", desc: "Deeper look into Lana's personal life, relationships, and background.", potential: "Medium Potential", potentialColor: "bg-amber-500/20 text-amber-400", score: 78 },
];

export function NarrativeGapsDetected() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Narrative Gaps Detected</h3>
          <p className="text-xs text-slate-500">High-potential angles competitors haven't explored</p>
        </div>
        <button className="text-slate-500 hover:text-slate-300">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {GAPS.map((g) => (
          <div key={g.n} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-500/30">
            <span className="text-xs font-semibold text-slate-500">{g.n}</span>
            <p className="mt-1 text-sm font-semibold text-white">{g.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">{g.desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${g.potentialColor}`}>
                {g.potential}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Opportunity Score</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                  {g.score}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}