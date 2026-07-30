"use client";

const TOPICS = [
  { label: "Police Failures", pct: 28 },
  { label: "Missing Persons", pct: 24 },
  { label: "Cold Cases", pct: 19 },
  { label: "Court Cases", pct: 12 },
  { label: "Organized Crime", pct: 8 },
  { label: "Historical Crimes", pct: 5 },
  { label: "Others", pct: 4 },
];

export function TopPerformingTopics() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Performing Topics</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-2.5">
        {TOPICS.map((t) => (
          <div key={t.label}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">{t.label}</span>
              <span className="text-slate-400">{t.pct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${t.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}