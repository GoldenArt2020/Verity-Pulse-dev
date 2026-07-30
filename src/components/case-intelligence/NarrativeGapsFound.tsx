"use client";

const GAPS = [
  { n: 1, title: "Police Response Delay", desc: "Limited coverage on the delay in logging Lana as a missing person.", score: 91 },
  { n: 2, title: "Bank Activity Freeze", desc: "Minimal discussion around her bank accounts being frozen.", score: 87 },
  { n: 3, title: "Phone Data Analysis", desc: "Very little content on the lack of phone data investigation.", score: 84 },
];

export function NarrativeGapsFound() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Narrative Gaps Found</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-2">
        {GAPS.map((g) => (
          <div key={g.n} className="flex items-start gap-3 rounded-xl border border-slate-800/60 p-3 hover:border-blue-500/30">
            <span className="mt-0.5 shrink-0 rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
              Gap {g.n}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white">{g.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{g.desc}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-xs font-bold text-emerald-400">
              {g.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}