"use client";

import { Landmark, Users, Newspaper, FileText, MessagesSquare } from "lucide-react";

const SOURCES = [
  { icon: Landmark, name: "Met Police (Official)", sub: "Official Statement", reliability: 95 },
  { icon: Users, name: "Family Interviews", sub: "Primary Source", reliability: 92 },
  { icon: Newspaper, name: "News Articles", sub: "Media", reliability: 78 },
  { icon: FileText, name: "Court Documents", sub: "Official Record", reliability: 88 },
  { icon: MessagesSquare, name: "Community Reports", sub: "Secondary Source", reliability: 65 },
];

function reliabilityColor(v: number) {
  return v >= 85 ? "bg-emerald-400" : v >= 70 ? "bg-emerald-400/70" : "bg-amber-400";
}

export function TopIntelligenceSources({ caseId }: { caseId?: string }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Intelligence Sources</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const filled = Math.round((s.reliability / 100) * 7);
          return (
            <div key={s.name} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">{s.name}</p>
                <p className="text-[11px] text-slate-500">{s.sub}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-slate-500">Reliability</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-1.5 rounded-sm ${i < filled ? reliabilityColor(s.reliability) : "bg-slate-800"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">{s.reliability}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}