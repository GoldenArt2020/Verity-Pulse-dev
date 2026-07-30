"use client";

import { LucideIcon, ArrowUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  change: string;
  period: string;
  sparkline: { v: number }[];
  loading?: boolean;
}

export function StatCard({ icon: Icon, iconColor, label, value, change, period, sparkline, loading }: StatCardProps) {
  if (loading) {
    return <div className="h-[132px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />;
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:-translate-y-1 hover:border-blue-500/30">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="font-mono-vp text-2xl font-semibold text-white">{value}</p>

      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className="flex items-center gap-0.5 font-medium text-emerald-400">
          <ArrowUp className="h-3 w-3" />
          {change}
        </span>
        <span className="text-slate-500">{period}</span>
      </div>
    </div>
  );
}