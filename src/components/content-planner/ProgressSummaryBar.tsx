"use client";

import { Clock, CheckCircle2, Users, History } from "lucide-react";
import { PROGRESS_SUMMARY } from "@/constants/contentPlannerWorkflow";

function RadialMini({ value }: { value: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-white">{value}%</span>
    </div>
  );
}

export function ProgressSummaryBar() {
  const s = PROGRESS_SUMMARY;

  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <div className="flex items-center gap-3">
        <RadialMini value={s.overallProgress} />
        <div>
          <p className="text-[11px] text-slate-500">Overall Progress</p>
          <p className="text-[13px] font-semibold text-emerald-400">{s.status}</p>
          <p className="text-[10.5px] text-slate-500">{s.statusNote}</p>
        </div>
      </div>

      <Divider />

      <Item icon={Clock} label="Estimated Duration" value={s.estimatedDuration} sub={s.durationRange} />

      <Divider />

      <Item icon={CheckCircle2} label="Tasks Completed" value={s.tasksCompleted} sub={s.pendingTasks} iconColor="text-emerald-400" />

      <Divider />

      <Item icon={Users} label="Team Members" value={String(s.teamMembers)} sub={s.activeNow} iconColor="text-blue-400" />

      <Divider />

      <Item icon={History} label="Last Updated" value={s.lastUpdated} sub={s.lastUpdatedBy} />
    </div>
  );
}

function Divider() {
  return <div className="h-10 w-px bg-slate-800/60" />;
}

function Item({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = "text-slate-400",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60">
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[10.5px] text-slate-500">{label}</p>
        <p className="text-[13px] font-semibold text-white">{value}</p>
        <p className="text-[10.5px] text-slate-500">{sub}</p>
      </div>
    </div>
  );
}