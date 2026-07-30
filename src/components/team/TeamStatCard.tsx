"use client";

import { Users, Radio, Calendar, Shuffle, TrendingUp, MailOpen } from "lucide-react";

const ICON_MAP = { users: Users, radio: Radio, calendar: Calendar, shuffle: Shuffle, trendingUp: TrendingUp, mailOpen: MailOpen };

export function TeamStatCard({
  icon,
  label,
  value,
  sub,
  subUp,
  color,
  dot,
}: {
  icon: keyof typeof ICON_MAP;
  label: string;
  value: string;
  sub: string;
  subUp?: boolean;
  color: string;
  dot?: boolean;
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
        <p className={`flex items-center gap-1 text-[10.5px] ${subUp ? "text-emerald-400" : "text-slate-500"}`}>
          {dot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          {subUp && "↑ "}
          {sub}
        </p>
      </div>
    </div>
  );
}