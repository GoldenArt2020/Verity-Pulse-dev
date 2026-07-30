"use client";

import { WORKFLOW_STAGES } from "@/constants/contentPlannerWorkflow";

const ACCENT_DOT: Record<string, string> = {
  emerald: "bg-emerald-500 border-emerald-500",
  blue: "bg-blue-500 border-blue-500",
  purple: "bg-purple-500 border-purple-500",
  amber: "bg-amber-500 border-amber-500",
  rose: "border-slate-700 bg-slate-800",
};

const ACCENT_LINE: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  rose: "bg-slate-700",
};

export function WorkflowStepper() {
  return (
    <div className="relative flex items-center px-1 py-2">
      {WORKFLOW_STAGES.map((stage, idx) => (
        <div key={stage.id} className="flex flex-1 items-center last:flex-none">
          <div
            className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${ACCENT_DOT[stage.accent]}`}
            title={stage.title}
          />
          {idx < WORKFLOW_STAGES.length - 1 && (
            <div className="mx-1 h-[2px] flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${ACCENT_LINE[stage.accent]}`}
                style={{ width: `${stage.percent}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}