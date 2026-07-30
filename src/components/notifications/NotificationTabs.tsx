"use client";

import { useState } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { NOTIFICATION_TABS } from "@/constants/notifications";

export function NotificationTabs() {
  const [active, setActive] = useState("All Notifications");

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 p-2">
      <div className="flex items-center gap-1">
        {NOTIFICATION_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.label)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium ${
              active === tab.label ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] ${active === tab.label ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pr-1">
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-slate-800/50">
          <Check className="h-3.5 w-3.5" /> Mark all as read
        </button>
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-slate-800/50">
          <Filter className="h-3.5 w-3.5" /> Filter <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}