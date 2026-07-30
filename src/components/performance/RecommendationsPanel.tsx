"use client";

import { Rocket, Pencil, Target } from "lucide-react";

const RECS = [
  { icon: Rocket, color: "bg-blue-500/15 text-blue-400", title: "Double down on institutional failure cases.", desc: "High engagement + high retention." },
  { icon: Pencil, color: "bg-purple-500/15 text-purple-400", title: "Improve thumbnails with more contrast.", desc: "Could increase CTR by 15%." },
  { icon: Target, color: "bg-amber-500/15 text-amber-400", title: "Add more end screens.", desc: "You're missing 2.3K potential clicks." },
];

export function RecommendationsPanel() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Recommendations</h3>

      <div className="mt-3 space-y-1">
        {RECS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.title} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{r.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{r.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/40">
        View All Recommendations
      </button>
    </div>
  );
}