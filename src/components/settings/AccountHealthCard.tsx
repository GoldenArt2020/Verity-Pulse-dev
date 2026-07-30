"use client";

import { CheckCircle2 } from "lucide-react";
import { ACCOUNT_HEALTH } from "@/constants/settings";

export function AccountHealthCard() {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ACCOUNT_HEALTH.score / 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Account Health</h3>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold text-white">{ACCOUNT_HEALTH.score}%</span>
            <span className="text-[10px] text-emerald-400">{ACCOUNT_HEALTH.label}</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {ACCOUNT_HEALTH.checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-[11.5px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-300">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Details
      </button>
    </div>
  );
}