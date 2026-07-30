"use client";

import { Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DATA = [
  { date: "Apr 21", score: 42 }, { date: "Apr 28", score: 48 }, { date: "May 5", score: 55 },
  { date: "May 12", score: 60 }, { date: "May 19", score: 58 }, { date: "May 26", score: 66 },
  { date: "Jun 2", score: 72 }, { date: "Jun 9", score: 80 }, { date: "Jun 16", score: 92 },
];

export function OpportunityOverview() {
  return (
    <div className="glass-card col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-white">Opportunity Overview</h3>
          <Info className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            <option>Opportunity Score</option>
          </select>
          <select className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA}>
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} fill="url(#scoreFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4 border-t border-slate-800/60 pt-4">
        <div>
          <p className="text-[11px] text-slate-500">Average Opportunity Score</p>
          <p className="text-lg font-semibold text-white">72 <span className="text-xs text-emerald-400">↑14%</span></p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Highest Score</p>
          <p className="text-lg font-semibold text-white">98</p>
          <p className="text-[11px] text-slate-500">The Isabella Gardner Heist</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Lowest Score</p>
          <p className="text-lg font-semibold text-white">28</p>
          <p className="text-[11px] text-slate-500">Local Case Files</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Standout Category</p>
          <p className="text-lg font-semibold text-white">Missing Persons</p>
          <p className="text-[11px] text-emerald-400">↑26% Opportunity</p>
        </div>
      </div>
    </div>
  );
}