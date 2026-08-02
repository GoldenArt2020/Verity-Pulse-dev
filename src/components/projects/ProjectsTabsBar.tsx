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
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
          <button
            onClick={() => setView("board")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
              view === "board" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Board
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
              view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        <button className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-[12.5px] font-medium text-foreground/80 hover:bg-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[12.5px] font-semibold text-brand-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> New Project
        </button>
      </div>
    </div>
  );
}