"use client";

import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { PRE_PUBLISH_CHECKLIST } from "@/constants/contentPlannerWorkflow";

export function PrePublishChecklist() {
  const doneCount = PRE_PUBLISH_CHECKLIST.filter((c) => c.done).length;
  const total = PRE_PUBLISH_CHECKLIST.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Pre-Publish Checklist</h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {doneCount} / {total}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {PRE_PUBLISH_CHECKLIST.map((item) => {
          const Icon = item.done ? CheckCircle2 : item.inProgress ? CircleDot : Circle;
          const color = item.done
            ? "text-emerald-400"
            : item.inProgress
            ? "text-amber-400"
            : "text-slate-600";
          return (
            <div key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} strokeWidth={2} />
              <span
                className={`text-[12px] ${
                  item.done ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-[10.5px] text-slate-500">{pct}%</p>
    </div>
  );
}