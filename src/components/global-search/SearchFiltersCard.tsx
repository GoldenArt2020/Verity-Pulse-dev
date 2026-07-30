"use client";

import { ChevronDown } from "lucide-react";

const FILTERS = [
  { label: "Content Type", value: "All Types" },
  { label: "Project", value: "All Projects" },
  { label: "Date Range", value: "Any Time" },
  { label: "Tags", value: "Select tags..." },
];

export function SearchFiltersCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Search Filters</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">Clear All</button>
      </div>

      <input
        placeholder="Filter by keyword..."
        className="mt-3 h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-[13px] text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
      />

      <div className="mt-3 space-y-3">
        {FILTERS.map((f) => (
          <div key={f.label}>
            <p className="mb-1 text-[11.5px] text-slate-500">{f.label}</p>
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-[12.5px] text-slate-300">
              {f.value} <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full rounded-xl bg-blue-500 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-600">
        Apply Filters
      </button>
    </div>
  );
}