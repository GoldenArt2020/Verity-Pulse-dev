"use client";

import { Search, ChevronDown, Plus } from "lucide-react";

export function SavedCasesFilterBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search saved cases..."
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-[13px] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
        />
      </div>

      <FilterDropdown label="All Status" />
      <FilterDropdown label="All Categories" />
      <FilterDropdown label="All Tags" />
      <FilterDropdown label="Sort: Recently Saved" />

      <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-600">
        <Plus className="h-4 w-4" /> Add Case
      </button>
    </div>
  );
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
      {label} <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
    </button>
  );
}