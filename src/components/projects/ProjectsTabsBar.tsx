"use client";

import { useState } from "react";
import { LayoutGrid, List, SlidersHorizontal, Plus, ChevronDown } from "lucide-react";
import { PROJECT_TABS } from "@/constants/projects";

export function ProjectsTabsBar() {
  const [activeTab, setActiveTab] = useState(0);
  const [view, setView] = useState<"board" | "list">("list");

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {PROJECT_TABS.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors ${
              activeTab === idx
                ? "bg-blue-500/15 text-blue-400"
                : "text-slate-400 hover:bg-slate-800/50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-0.5">
          <button
            onClick={() => setView("board")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
              view === "board" ? "bg-slate-800 text-white" : "text-slate-500"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Board
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
              view === "list" ? "bg-slate-800 text-white" : "text-slate-500"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        <button className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>

        <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-blue-600">
          <Plus className="h-3.5 w-3.5" /> New Project
        </button>
      </div>
    </div>
  );
}