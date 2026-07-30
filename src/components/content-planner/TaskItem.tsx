"use client";

import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { WorkflowTask } from "@/constants/contentPlannerWorkflow";

const STATUS_ICON = {
  done: CheckCircle2,
  in_progress: CircleDot,
  pending: Circle,
};

const STATUS_COLOR = {
  done: "text-emerald-400",
  in_progress: "text-amber-400",
  pending: "text-slate-600",
};

export function TaskItem({ task }: { task: WorkflowTask }) {
  const Icon = STATUS_ICON[task.status];

  return (
    <button className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-800/40">
      <div className="min-w-0">
        <p
          className={`truncate text-[12.5px] font-medium ${
            task.status === "pending" ? "text-slate-400" : "text-slate-200"
          }`}
        >
          {task.label}
        </p>
        <p className="text-[10.5px] text-slate-500">{task.date}</p>
      </div>
      <Icon className={`h-4 w-4 shrink-0 ${STATUS_COLOR[task.status]}`} strokeWidth={2} />
    </button>
  );
}