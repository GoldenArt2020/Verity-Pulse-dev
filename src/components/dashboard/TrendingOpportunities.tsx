"use client";

const ITEMS = [
  { title: "The Disappearance of Lana Purcell", loc: "London, UK", tag: "Missing Person", score: 92, img: "" },
  { title: "The Soho House Murder Mystery", loc: "London, UK", tag: "Unsolved Murder", score: 88, img: "" },
  { title: "The Vanishing of Andrew Gosden", loc: "Doncaster, UK", tag: "Missing Person", score: 85, img: "" },
  { title: "The Jeremy Bamber Case Revisited", loc: "Essex, UK", tag: "Court Case", score: 83, img: "" },
  { title: "The M62 Truck Stop Murder", loc: "West Yorkshire, UK", tag: "Murder", score: 81, img: "" },
];

export function TrendingOpportunities() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Trending Opportunities</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-800/40"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-slate-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
              <p className="text-[11px] text-slate-500">
                {item.loc} · {item.tag}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}