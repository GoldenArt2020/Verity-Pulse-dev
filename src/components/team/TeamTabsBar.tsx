"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, MoreVertical } from "lucide-react";
import { TEAM_TABS } from "@/constants/team";

export function TeamTabsBar() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 px-1">
      <div className="flex items-center gap-1">
        {TEAM_TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActive(idx)}
            className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active === idx ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
            {active === idx && (
              <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pb-2">
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
          All Teams <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
        <button className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-800/50">
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}