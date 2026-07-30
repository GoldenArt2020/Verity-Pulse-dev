"use client";

import { Sparkles } from "lucide-react";

export function SearchTipsBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-2.5 text-[12px] text-slate-400">
      <p className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        Tip: Use quotes for exact match <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">"Lana Purcell"</code>
        {" "}· Use - to exclude terms <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Lana -video</code>
        {" "}· Use OR for multiple terms <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">missing OR disappearance</code>
      </p>
      <button className="font-medium text-blue-400 hover:text-blue-300">Learn more about Search ↗</button>
    </div>
  );
}