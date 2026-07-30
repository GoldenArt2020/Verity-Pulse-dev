"use client";

import { Info } from "lucide-react";

const BREAKDOWN = [
  { label: "High Opportunity", range: "80 - 100", pct: 36, color: "bg-emerald-500", dot: "bg-emerald-400" },
  { label: "Medium Opportunity", range: "50 - 79", pct: 42, color: "bg-amber-500", dot: "bg-amber-400" },
  { label: "Low Opportunity", range: "0 - 49", pct: 22, color: "bg-rose-500", dot: "bg-rose-400" },
];

export function OpportunityGauge() {
  const score = 72;
  const angle = (score / 100) * 180;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-1.5">
        <h3 className="text-base font-semibold text-white">Opportunity Score Distribution</h3>
        <Info className="h-3.5 w-3.5 text-slate-500" />
      </div>

      <div className="relative mx-auto mt-4 h-[130px] w-[220px]">
        <svg viewBox="0 0 220 130" className="h-full w-full">
          <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 283} 283`}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <span className="font-mono-vp text-4xl font-bold text-white">{score}</span>
          <span className="text-xs text-emerald-400">Good Opportunity</span>
        </div>
      </div>

      <div className="mt-2 space-y-2.5">
        {BREAKDOWN.map((b) => (
          <div key={b.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${b.dot}`} />
              <span className="text-slate-400">{b.range}</span>
              <span className="text-slate-300">{b.label}</span>
            </div>
            <span className="font-medium text-white">{b.pct}%</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
        <span className="text-slate-500">Total Analyzed</span>
        <span className="font-semibold text-white">248</span>
      </div>
    </div>
  );
}