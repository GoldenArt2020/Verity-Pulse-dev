"use client";

import { Bookmark } from "lucide-react";

const CASES = [
  { title: "The Disappearance of Lana Purcell", loc: "London, UK", tag: "Missing Person", tagColor: "bg-blue-500/20 text-blue-400", score: 92, time: "2h ago" },
  { title: "The Soho House Murder Mystery", loc: "London, UK", tag: "Unsolved Murder", tagColor: "bg-rose-500/20 text-rose-400", score: 88, time: "5h ago" },
  { title: "The Vanishing of Andrew Gosden", loc: "Doncaster, UK", tag: "Missing Person", tagColor: "bg-blue-500/20 text-blue-400", score: 85, time: "1d ago" },
  { title: "The Jeremy Bamber Case Revisited", loc: "Essex, UK", tag: "Court Case", tagColor: "bg-amber-500/20 text-amber-400", score: 83, time: "1d ago" },
  { title: "The M62 Truck Stop Murder", loc: "West Yorkshire, UK", tag: "Murder", tagColor: "bg-rose-500/20 text-rose-400", score: 81, time: "2d ago" },
];

export function RecentCases() {
  return (
    <div className="glass-card col-span-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Recent Cases Analyzed</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        {CASES.map((c) => (
          <div
            key={c.title}
            className="group cursor-pointer rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 transition-all hover:-translate-y-1 hover:border-blue-500/30"
          >
            <div className="relative h-20 w-full rounded-lg bg-slate-800">
              <span className="absolute right-1.5 top-1.5 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                {c.score}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] font-medium text-white">{c.title}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.loc}</p>
            <span className={`mt-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${c.tagColor}`}>
              {c.tag}
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Researched {c.time}</span>
              <Bookmark className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}