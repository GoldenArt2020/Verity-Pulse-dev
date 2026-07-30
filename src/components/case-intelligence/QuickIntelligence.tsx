"use client";

const STATS = [
  { label: "Articles Analyzed", value: "248" },
  { label: "Videos Analyzed", value: "37" },
  { label: "Reddit Threads", value: "126" },
  { label: "Court Documents", value: "12" },
  { label: "Police Reports", value: "8" },
  { label: "Forum Mentions", value: "312" },
];

export function QuickIntelligence() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Quick Intelligence</h3>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className="font-mono-vp text-xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}