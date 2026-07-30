"use client";

import { ArrowUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  label: string;
  value: string;
  change: string;
  period: string;
  sparkline: { v: number }[];
  color: string;
}

export function PerformanceStatCard({ label, value, change, period, sparkline, color }: Props) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:-translate-y-1 hover:border-blue-500/30">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-mono-vp mt-1 text-2xl font-semibold text-white">{value}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className="flex items-center gap-0.5 font-medium text-emerald-400">
          <ArrowUp className="h-3 w-3" />
          {change}
        </span>
        <span className="truncate text-slate-500">{period}</span>
      </div>
      <div className="mt-2 h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkline}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}