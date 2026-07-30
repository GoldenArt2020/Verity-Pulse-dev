"use client";

export function OptimizeHeader() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-800" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-white">The Disappearance of Lana Purcell</h1>
            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">Missing Person</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">London, UK &nbsp;|&nbsp; Jan 2011 &nbsp;|&nbsp; 27 years old</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Lana Purcell vanished in North London while walking to a nearby shop. Despite multiple
            appeals and a £20,000 reward, she has never been found.
          </p>
          <button className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View Case Dossier ↗
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4 border-t border-slate-800/60 pt-5">
        <div className="text-center">
          <p className="mb-1 text-[11px] text-slate-500">Opportunity Score</p>
          <div className="relative mx-auto h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.92)} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">92</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-400">Excellent</p>
          <p className="text-[10px] text-slate-500">Top 8% of all opportunities</p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Search Trend (30D)</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">↑ 312%</p>
          <p className="text-[10px] text-slate-500">Strong upward trend</p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">YouTube Coverage</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">Low</p>
          <p className="text-sm text-white">2.1 <span className="text-[11px] text-slate-500">/10</span></p>
          <p className="text-[10px] text-slate-500">Top 15% lowest</p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Competition Score</p>
          <p className="mt-1 text-xl font-semibold text-white">18 <span className="text-[11px] font-normal text-slate-500">/100</span></p>
          <p className="text-[11px] font-medium text-emerald-400">Very Low</p>
        </div>
      </div>
    </div>
  );
}