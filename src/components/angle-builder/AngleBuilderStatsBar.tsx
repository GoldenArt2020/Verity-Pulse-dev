"use client";

import { Link2, Star, Activity, Users2, Clock } from "lucide-react";

export function AngleBuilderStatsBar() {
  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <Stat icon={Link2} iconColor="text-emerald-400" label="Angles Generated" value="10" sub="In 24.3s" />
      <Stat icon={Star} iconColor="text-amber-400" label="High Potential Angles" value="5" sub="50% of total" />
      <Stat icon={Activity} iconColor="text-emerald-400" label="Average Potential Score" value="84" sub="↑ 12% vs last 7 days" />
      <Stat icon={Users2} iconColor="text-slate-400" label="Competitor Angles Found" value="37" sub="3 major gaps identified" />
      <Stat icon={Clock} iconColor="text-slate-400" label="Last Generated" value="2 minutes ago" sub="By David Okafor" />
    </div>
  );
}

function Stat({ icon: Icon, iconColor, label, value, sub }: { icon: typeof Link2; iconColor: string; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.75} />
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
    </div>
  );
}