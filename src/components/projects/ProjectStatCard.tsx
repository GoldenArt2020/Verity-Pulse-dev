"use client";

import { Folder, Play, CheckCircle2, PauseCircle, Gauge, Briefcase, ArrowUp, ArrowDown } from "lucide-react";

const ICON_MAP = { folder: Folder, play: Play, checkCircle: CheckCircle2, pauseCircle: PauseCircle, gauge: Gauge, briefcase: Briefcase };

export function ProjectStatCard({
  icon,
  label,
  value,
  delta,
  deltaUp,
  color,
}: {
  icon: keyof typeof ICON_MAP;
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  color: string;
}) {
  const Icon = ICON_MAP[icon];
  const DeltaIcon = deltaUp ? ArrowUp : ArrowDown;

  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="font-mono-vp text-xl font-bold text-white">{value}</p>
        <p className={`flex items-center gap-0.5 text-[10.5px] ${deltaUp ? "text-emerald-400" : "text-rose-400"}`}>
          <DeltaIcon className="h-3 w-3" /> {delta}
        </p>
      </div>
    </div>
  );
}