"use client";

const TRAITS = ["True Crime Enthusiasts", "18-45 Years Old", "UK Based", "High Watch Time", "Engages with Missing Persons content"];

export function AudienceProfileMatch() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Audience Profile Match</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View Full</button>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3"
              strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.94)} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">94%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-400">Excellent Match</p>
          <p className="mt-1 text-[11px] text-slate-500">Your Primary Audience</p>
          <div className="mt-1.5 space-y-1">
            {TRAITS.map((t) => (
              <p key={t} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="text-emerald-400">✓</span> {t}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}