"use client";

import { useState } from "react";
import { SEARCH_TABS } from "@/constants/globalSearch";

export function SearchTabs() {
  const [active, setActive] = useState("All Results");

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800/60 pb-px">
      {SEARCH_TABS.map((tab) => (
        <button
          key={tab.label}
          onClick={() => setActive(tab.label)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-medium ${
            active === tab.label ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] ${active === tab.label ? "bg-blue-500/15 text-blue-400" : "bg-slate-800 text-slate-500"}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}