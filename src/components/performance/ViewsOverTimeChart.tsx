"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DATA = [
  { date: "May 20", views: 48000 }, { date: "May 25", views: 52000 }, { date: "May 30", views: 45000 },
  { date: "Jun 4", views: 58000 }, { date: "Jun 9", views: 61000 }, { date: "Jun 16", views: 72400 },
];

export function ViewsOverTimeChart() {
  return (
    <div className="glass-card col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Views Over Time</h3>
        <select className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
          <option>Daily</option>
        </select>
      </div>

      <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Views</span>
        <span className="flex items-center gap-1.5"><span className="h-px w-3 border-t border-dashed border-slate-500" /> Previous Period</span>
      </div>

      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={DATA}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: "#3B82F6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}