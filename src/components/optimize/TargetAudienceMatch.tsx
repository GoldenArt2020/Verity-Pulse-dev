"use client";

const SEGMENTS = [
  { label: "True Crime Enthusiasts", value: "42%", color: "bg-blue-400" },
  { label: "Missing Persons Followers", value: "24%", color: "bg-purple-400" },
  { label: "UK Based Viewers", value: "18%", color: "bg-emerald-400" },
  { label: "Documentary Lovers", value: "10%", color: "bg-amber-400" },
  { label: "General Audience", value: "6%", color: "bg-slate-500" },
];

export function TargetAudienceMatch() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">5</span>
        <h3 className="text-sm font-semibold text-white">Target Audience Match</h3>
      </div>

      <div className="mt-2 flex justify-center">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.42)} />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#A855F7" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.24)} transform="rotate(151 18 18)" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.18)} transform="rotate(237 18 18)" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.16)} transform="rotate(302 18 18)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">94%</span>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] font-medium text-emerald-400">Excellent Match</p>

      <div className="mt-2 space-y-1">
        {SEGMENTS.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`h-2 w-2 rounded-full ${s.color}`} /> {s.label}
            </span>
            <span className="text-slate-400">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}