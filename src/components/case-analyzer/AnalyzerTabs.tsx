"use client";

import { useState } from "react";
import { LayoutGrid, GitBranch, Swords, Users, LineChart, Lightbulb } from "lucide-react";

const TABS = [
  { label: "Opportunity Analysis", icon: LayoutGrid },
  { label: "Narrative Gaps", icon: GitBranch },
  { label: "Competitor Breakdown", icon: Swords },
  { label: "Audience Intelligence", icon: Users },
  { label: "Search & Trends", icon: LineChart },
  { label: "Content Ideas", icon: Lightbulb },
];

export function AnalyzerTabs() {
  const [active, setActive] = useState("Opportunity Analysis");

  return (
    <div className="flex gap-6 border-b border-slate-800/60">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.label;
        return (
          <button
            key={t.label}
            onClick={() => setActive(t.label)}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              isActive ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}