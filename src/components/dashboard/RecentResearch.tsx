"use client";

import { FileText, CheckCircle2 } from "lucide-react";

const RESEARCH = [
  { title: "Lana Purcell Case Deep Dive", time: "2 hours ago" },
  { title: "Institutional Failure Angle", time: "5 hours ago" },
  { title: "Andrew Gosden Timeline", time: "1 day ago" },
  { title: "Media Coverage Analysis", time: "1 day ago" },
];

export function RecentResearch() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Recent Research</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {RESEARCH.map((r) => (
          <div key={r.title} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{r.title}</p>
              <p className="text-[11px] text-slate-500">{r.time}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          </div>
        ))}
      </div>
    </div>
  );
}