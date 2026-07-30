"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DATA = [
  { date: "Apr 21", v: 40 }, { date: "Apr 28", v: 46 }, { date: "May 5", v: 52 },
  { date: "May 12", v: 58 }, { date: "May 19", v: 56 }, { date: "May 26", v: 64 },
  { date: "Jun 2", v: 70 }, { date: "Jun 9", v: 80 }, { date: "Jun 16", v: 92 },
];

export function AudienceInterestChart() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Audience Interest Over Time</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View Full Analysis</button>
      </div>

      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA}>
            <defs>
              <linearGradient id="audienceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} fill="url(#audienceFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-[11px] text-slate-500">
        Interest is <span className="font-medium text-emerald-400">↑ 312%</span> higher than 30 days ago
      </p>
    </div>
  );
}