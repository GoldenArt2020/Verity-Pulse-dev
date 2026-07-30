"use client";

import { useState } from "react";
import { TrendingUp, FileText, Folder, BarChart, Bell, User, MoreVertical, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { SEARCH_RESULTS } from "@/constants/globalSearch";

const ICON_MAP = { trendingUp: TrendingUp, fileText: FileText, folder: Folder, barChart: BarChart, bell: Bell, user: User };

export function SearchResultsList() {
  const [page, setPage] = useState(1);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-500">Sort by:</p>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[12px] font-medium text-slate-300">
          Relevance <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {SEARCH_RESULTS.map((r) => (
          <div key={r.title} className="flex items-center gap-4 rounded-xl px-2 py-3 hover:bg-slate-800/40">
            {r.type === "image" ? (
              <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800" />
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.color}`}>
                {(() => {
                  const Icon = ICON_MAP[r.icon as keyof typeof ICON_MAP];
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-white">{r.title}</p>
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${r.tagColor}`}>{r.tag}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] text-slate-400">{r.desc}</p>
              {r.pills && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {r.pills.map((p) => (
                    <span key={p} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{p}</span>
                  ))}
                  {r.extraPills && <span className="text-[10px] text-slate-500">+{r.extraPills}</span>}
                </div>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p className="flex items-center justify-end gap-1 text-[12px] text-slate-400">
                {r.meta} {r.metaTag && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </p>
              <p className="text-[11px] text-slate-500">{r.date}</p>
            </div>

            <button className="shrink-0 text-slate-500 hover:text-slate-300">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4">
        <p className="text-[12px] text-slate-500">Showing 1 to 10 of 142 results</p>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800/50">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-7 w-7 rounded-lg text-[12px] font-medium ${page === p ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-800/50"}`}
            >
              {p}
            </button>
          ))}
          <span className="text-slate-600">...</span>
          <button className="h-7 w-7 rounded-lg text-[12px] font-medium text-slate-400 hover:bg-slate-800/50">15</button>
          <button className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800/50">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-[12px] text-slate-300">10 per page</button>
      </div>
    </div>
  );
}