"use client";

const ROWS = [
  { channel: "Crime Scene UK", videos: 1, views: "52K", quality: "Medium", qualityColor: "bg-amber-500/20 text-amber-400", opp: 42 },
  { channel: "True Crime Central", videos: 1, views: "34K", quality: "Low", qualityColor: "bg-rose-500/20 text-rose-400", opp: 48 },
  { channel: "UK Crime Files", videos: 2, views: "18K", quality: "Low", qualityColor: "bg-rose-500/20 text-rose-400", opp: 61 },
  { channel: "Real Case Docs", videos: 1, views: "12K", quality: "Low", qualityColor: "bg-rose-500/20 text-rose-400", opp: 64 },
  { channel: "Dark Truths", videos: 0, views: "—", quality: "", qualityColor: "", opp: 92 },
];

export function TopCompetitorsTable() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Competitors Covering This Case</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3">
        <div className="grid grid-cols-[1fr_50px_50px_70px_60px] gap-2 px-2 pb-2 text-[10px] font-medium uppercase text-slate-500">
          <span>Channel</span>
          <span className="text-right">Videos</span>
          <span className="text-right">Views</span>
          <span className="text-right">Avg. Quality</span>
          <span className="text-right">Opp.</span>
        </div>

        {ROWS.map((r) => (
          <div
            key={r.channel}
            className="grid grid-cols-[1fr_50px_50px_70px_60px] items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-800/40"
          >
            <span className="flex items-center gap-2 truncate text-[13px] font-medium text-white">
              <span className="h-6 w-6 shrink-0 rounded-full bg-slate-800" />
              {r.channel}
            </span>
            <span className="text-right text-xs text-slate-400">{r.videos}</span>
            <span className="text-right text-xs text-slate-400">{r.views}</span>
            <span className="text-right">
              {r.quality && (
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${r.qualityColor}`}>
                  {r.quality}
                </span>
              )}
            </span>
            <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500 text-[10px] font-bold text-emerald-400">
              {r.opp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}