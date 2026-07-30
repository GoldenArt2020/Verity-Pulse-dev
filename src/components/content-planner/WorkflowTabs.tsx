"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  Paperclip,
  Users,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { WORKFLOW_TABS } from "@/constants/contentPlannerWorkflow";

const TAB_ICONS = {
  Overview: LayoutDashboard,
  Workflow: GitBranch,
  Script: FileText,
  Assets: Paperclip,
  Team: Users,
  Schedule: CalendarDays,
  Analytics: BarChart3,
};

export function WorkflowTabs() {
  const [active, setActive] = useState<(typeof WORKFLOW_TABS)[number]>("Workflow");

  return (
    <div className="flex items-center gap-1 border-b border-slate-800/60 px-1">
      {WORKFLOW_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab];
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
              isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}