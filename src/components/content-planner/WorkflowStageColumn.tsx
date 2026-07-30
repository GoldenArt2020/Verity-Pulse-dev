"use client";

import { CheckCircle2, Search, FileText, Video, Rocket, Plus } from "lucide-react";
import { WorkflowStage } from "@/constants/contentPlannerWorkflow";
import { TaskItem } from "./TaskItem";

const ICON_MAP = {
  check: CheckCircle2,
  analysis: Search,
  script: FileText,
  production: Video,
  publish: Rocket,
};

const ACCENT_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
};

const ACCENT_TEXT: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
};

export function WorkflowStageColumn({ stage }: { stage: WorkflowStage }) {
  const Icon = ICON_MAP[stage.icon];

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT_BG[stage.accent]}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">{stage.title}</p>
            <p className="text-[10.5px] text-slate-500">{stage.dateRange}</p>
          </div>
        </div>
        <span className={`text-[12px] font-bold ${ACCENT_TEXT[stage.accent]}`}>
          {stage.percent}%
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-0.5">
        {stage.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      <button className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-slate-800 py-2 text-[11px] font-medium text-slate-400 hover:bg-slate-800/40">
        <Plus className="h-3 w-3" /> Add Task
      </button>
    </div>
  );
}