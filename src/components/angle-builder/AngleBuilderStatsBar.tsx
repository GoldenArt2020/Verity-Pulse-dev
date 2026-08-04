// src/components/angle-builder/AngleBuilderStatsBar.tsx
"use client";

import { Link2, Activity, Clock } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

export function AngleBuilderStatsBar({
  angles,
  loading,
  lastGeneratedAt,
}: {
  angles: GeneratedAngle[];
  loading: boolean;
  lastGeneratedAt: string | null;
}) {
  const avgScore = angles.length
    ? Math.round(
        angles.reduce(
          (sum, a) =>
            sum + a.scores.searchDemand + a.scores.competition + a.scores.emotionalImpact + a.scores.originality + a.scores.audienceMatch,
          0
        ) / angles.length
      )
    : 0;

  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <Stat icon={Link2} iconColor="text-emerald-400" label="Angles Generated" value={loading ? "—" : String(angles.length)} />
      <Stat icon={Activity} iconColor="text-blue-400" label="Average Score" value={loading ? "—" : String(avgScore)} />
      <Stat
        icon={Clock}
        iconColor="text-slate-400"
        label="Last Generated"
        value={lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleTimeString() : "—"}
      />
    </div>
  );
}

function Stat({ icon: Icon, iconColor, label, value }: { icon: typeof Link2; iconColor: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.75} />
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}