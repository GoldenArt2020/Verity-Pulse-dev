"use client";

import { Bookmark } from "lucide-react";
import { SAVED_SEARCHES } from "@/constants/globalSearch";

export function SavedSearchesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Saved Searches</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">Manage</button>
      </div>

      <div className="mt-3 space-y-1">
        {SAVED_SEARCHES.map((s) => (
          <button key={s} className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left text-[12.5px] text-slate-300 hover:bg-slate-800/40">
            <Bookmark className="h-3.5 w-3.5 text-slate-500" /> {s}
          </button>
        ))}
      </div>
    </div>
  );
}