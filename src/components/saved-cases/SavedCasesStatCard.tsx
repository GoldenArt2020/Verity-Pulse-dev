"use client";

import { Bookmark, Search, TrendingUp, Star, PauseCircle, Archive } from "lucide-react";

const ICON_MAP = { bookmark: Bookmark, search: Search, trending: TrendingUp, star: Star, pause: PauseCircle, archive: Archive };

export function SavedCasesStatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: keyof typeof ICON_MAP;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  const Icon = ICON_MAP[icon];

  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="font-mono-vp text-xl font-bold text-white">{value}</p>
        <p className="truncate text-[10.5px] text-slate-500">{sub}</p>
      </div>
    </div>
  );
}