"use client";

import { CalendarClock } from "lucide-react";
import { PUBLISHING_SCHEDULE } from "@/constants/contentPlannerWorkflow";

export function PublishingScheduleCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Publishing Schedule</h3>
      <p className="mt-2 text-[10.5px] text-slate-500">Planned Publish Date</p>

      <div className="mt-1 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-blue-400" />
        <span className="text-[15px] font-bold text-white">{PUBLISHING_SCHEDULE.plannedDate}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {PUBLISHING_SCHEDULE.day} • {PUBLISHING_SCHEDULE.time}
      </p>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2 text-[11px] font-medium text-slate-300 hover:bg-slate-800/40">
        Reschedule
      </button>
    </div>
  );
}