"use client";

const KEYWORDS = [
  { keyword: "police neglect", volume: "12.1K", impact: "High", color: "bg-emerald-400" },
  { keyword: "missing person", volume: "110K", impact: "High", color: "bg-emerald-400" },
  { keyword: "lana purcell", volume: "1.3K", impact: "High", color: "bg-emerald-400" },
  { keyword: "unsolved", volume: "60.5K", impact: "Medium", color: "bg-amber-400" },
  { keyword: "cold case", volume: "40.2K", impact: "Medium", color: "bg-amber-400" },
];

export function KeywordsImpact() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">3</span>
        <h3 className="text-sm font-semibold text-white">Keywords Impact</h3>
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[1fr_60px_50px] gap-2 text-[10px] font-medium uppercase text-slate-500">
          <span>Keyword</span>
          <span className="text-right">Search Volume</span>
          <span className="text-right">Impact</span>
        </div>
        {KEYWORDS.map((k) => (
          <div key={k.keyword} className="grid grid-cols-[1fr_60px_50px] items-center gap-2">
            <span className="truncate text-xs text-slate-300">{k.keyword}</span>
            <span className="text-right text-xs text-slate-400">{k.volume}</span>
            <span className="flex items-center justify-end gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${k.color}`} />
              <span className="text-[11px] text-slate-300">{k.impact}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}