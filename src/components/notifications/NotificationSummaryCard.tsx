"use client";

import { Bell, Mail, AtSign, Flag } from "lucide-react";
import { NOTIFICATION_SUMMARY, SUMMARY_BREAKDOWN } from "@/constants/notifications";

const ICON_MAP = { bell: Bell, mail: Mail, at: AtSign, flag: Flag };

export function NotificationSummaryCard() {
  const total = SUMMARY_BREAKDOWN.reduce((s, b) => s + b.pct, 0);
  let acc = 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Notification Summary</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View Insights →</button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {NOTIFICATION_SUMMARY.map((s) => {
          const Icon = ICON_MAP[s.icon as keyof typeof ICON_MAP];
          return (
            <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-center">
              <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
            {SUMMARY_BREAKDOWN.map((b) => {
              const dash = (b.pct / 100) * circumference;
              const offset = -((acc / 100) * circumference);
              acc += b.pct;
              return (
                <circle
                  key={b.label}
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={b.color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">18</span>
            <span className="text-[9.5px] text-slate-500">Total</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {SUMMARY_BREAKDOWN.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} /> {b.label}
              </span>
              <span className="text-slate-500">{b.value} ({b.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}