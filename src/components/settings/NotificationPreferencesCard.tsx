"use client";

import { useState } from "react";
import { Sparkles, Key, Folder, AlertTriangle, BarChart3 } from "lucide-react";
import { NOTIFICATION_PREFERENCES, NotificationRow } from "@/constants/settings";

const ICON_MAP = { sparkles: Sparkles, key: Key, folder: Folder, alertTriangle: AlertTriangle, barChart: BarChart3 };

function Toggle({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  const [on, setOn] = useState(checked);
  return (
    <button
      onClick={() => !disabled && setOn((v) => !v)}
      className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? "bg-blue-500" : "bg-slate-700"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span
        className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationPreferencesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Notification Preferences</h3>

      <div className="mt-3 grid grid-cols-[1fr_60px_60px_60px] items-center gap-2 px-1 text-[10.5px] font-medium uppercase text-slate-500">
        <span>Notification Type</span>
        <span className="text-center">Email</span>
        <span className="text-center">In-App</span>
        <span className="text-center">SMS</span>
      </div>

      <div className="mt-1 space-y-1">
        {NOTIFICATION_PREFERENCES.map((row: NotificationRow) => {
          const Icon = ICON_MAP[row.icon as keyof typeof ICON_MAP];
          return (
            <div key={row.label} className="grid grid-cols-[1fr_60px_60px_60px] items-center gap-2 rounded-xl px-1 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.color}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{row.label}</p>
                  <p className="truncate text-[10.5px] text-slate-500">{row.sub}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Toggle checked={row.email} />
              </div>
              <div className="flex justify-center">
                <Toggle checked={row.inApp} />
              </div>
              <div className="flex justify-center">
                <Toggle checked={row.sms} disabled={!row.sms && row.label !== "System Alerts"} />
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        Manage All Notifications
      </button>
    </div>
  );
}