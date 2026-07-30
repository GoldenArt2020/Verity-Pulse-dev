"use client";

import { Mail, Smartphone, Bell, Clock } from "lucide-react";
import { NOTIFICATION_PREFERENCES } from "@/constants/notifications";

const ICON_MAP = { mail: Mail, smartphone: Smartphone, bell: Bell, clock: Clock };

export function NotificationPreferencesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Notification Preferences</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">Manage</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {NOTIFICATION_PREFERENCES.map((p) => {
          const Icon = ICON_MAP[p.icon as keyof typeof ICON_MAP];
          return (
            <div key={p.label} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-200">{p.label}</p>
              <p className={`text-[11px] font-medium ${p.color}`}>{p.status}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}