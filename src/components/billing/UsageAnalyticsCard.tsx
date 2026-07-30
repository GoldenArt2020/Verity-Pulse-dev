"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { USAGE_CHART_DATA } from "@/constants/billing";

const RANGES = ["Last 30 Days", "Last 3 Months", "Last 6 Months", "Last Year"];

export function UsageAnalyticsCard() {
  const [range, setRange] = useState("Last 30 Days");

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Usage Analytics</h3>
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                range === r ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={USAGE_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="searches" stroke="#3B82F6" strokeWidth={2} dot={false} name="Opportunity Searches" />
              <Line type="monotone" dataKey="insights" stroke="#A855F7" strokeWidth={2} dot={false} name="AI Insights" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-4 md:w-40">
          <div>
            <p className="text-xl font-bold text-white">248</p>
            <p className="text-[11px] text-slate-500">Opportunity Searches</p>
            <p className="text-[10.5px] font-medium text-emerald-400">↑ 12% vs last 30 days</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">142</p>
            <p className="text-[11px] text-slate-500">AI Insights</p>
            <p className="text-[10.5px] font-medium text-emerald-400">↑ 18% vs last 30 days</p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded bg-blue-500" /> Opportunity Searches</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded bg-purple-500" /> AI Insights</span>
      </div>
    </div>
  );
}