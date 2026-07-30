"use client";

const USAGE = [
  { label: "Research Runs", used: 42, total: 100 },
  { label: "AI Narratives Generated", used: 18, total: 50 },
  { label: "SEO Scores Run", used: 27, total: 50 },
];

export function UsageOverviewCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Usage Overview</h3>
      <div className="mt-3 space-y-3">
        {USAGE.map((u) => (
          <div key={u.label}>
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-slate-400">{u.label}</span>
              <span className="text-slate-300">{u.used}/{u.total}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${(u.used / u.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}