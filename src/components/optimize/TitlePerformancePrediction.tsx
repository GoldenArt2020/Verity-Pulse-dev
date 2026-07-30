"use client";

import { Info } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";

const DATA = [
  { d: "Day 1", v: 2 }, { d: "Day 7", v: 4 }, { d: "Day 30", v: 7 }, { d: "Day 90", v: 9.3 },
];

const COMPARISON = [
  { label: "This Title (Predicted)", value: 9.3, pct: 100, color: "bg-emerald-500" },
  { label: "Top 10% Performing Titles", value: 8.1, pct: 87, color: "bg-blue-500" },
  { label: "Channel Average", value: 5.4, pct: 58, color: "bg-blue-500" },
  { label: "Bottom 10% Titles", value: 2.1, pct: 23, color: "bg-blue-500" },
];

const WHY = ["Includes institutional failure keyword", "High emotional curiosity gap", "Specific + intriguing framing", "Matches your top performing pattern"];

export function TitlePerformancePrediction() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">2</span>
        <h3 className="text-base font-semibold text-white">Title Performance Prediction</h3>
        <Info className="h-3.5 w-3.5 text-slate-500" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-slate-500">Predicted CTR</p>
          <p className="text-3xl font-bold text-white">9.3%</p>
          <p className="text-xs font-medium text-emerald-400">Excellent</p>
          <p className="text-[11px] text-slate-500">Top 6% of similar videos</p>
          <div className="mt-2 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="ctrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="url(#ctrFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500">Historical Performance Comparison</p>
          <p className="text-[11px] text-slate-500">Based on 1,248 similar videos</p>
          <div className="mt-3 space-y-3">
            {COMPARISON.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="font-medium text-white">{c.value}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-800/60 pt-4">
        <p className="text-xs font-medium text-slate-400">Why this title works</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {WHY.map((w) => (
            <div key={w} className="flex items-start gap-1.5 rounded-xl border border-slate-800/60 p-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-[11px] leading-snug text-slate-300">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}