"use client";

const SEGMENTS = [
  { label: "Search Demand", value: "25/25", color: "text-blue-400", dot: "bg-blue-400" },
  { label: "Competition", value: "20/20", color: "text-amber-400", dot: "bg-amber-400" },
  { label: "Emotional Impact", value: "20/25", color: "text-purple-400", dot: "bg-purple-400" },
  { label: "Originality", value: "15/15", color: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "Audience Match", value: "11/10", color: "text-blue-300", dot: "bg-blue-300" },
];

export function AngleScoreBreakdown() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Angle Score Breakdown</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View Details</button>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.28)} />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.22)} transform="rotate(100 18 18)" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#A855F7" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.22)} transform="rotate(180 18 18)" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.16)} transform="rotate(260 18 18)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">91</span>
            <span className="text-[9px] text-emerald-400">Excellent</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {SEGMENTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
              </span>
              <span className="font-medium text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}