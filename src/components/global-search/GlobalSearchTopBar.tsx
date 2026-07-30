"use client";

import { Search, X, HelpCircle, Bell, Zap, ChevronDown } from "lucide-react";
import { useState } from "react";

export function GlobalSearchTopBar() {
  const [query, setQuery] = useState("Lana Purcell");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-white">Global Search</h1>
        <p className="text-sm text-slate-400">Found 142 results for "{query}"</p>
      </div>

      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-11 pr-20 text-sm text-white focus:border-blue-500/60 focus:outline-none"
        />
        <button onClick={() => setQuery("")} className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800/50">
          <HelpCircle className="h-4.5 w-4.5" />
        </button>
        <button className="relative rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800/50">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">18</span>
        </button>
        <button className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
          <Zap className="h-4 w-4" /> Quick Actions <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}