"use client";

import { LogIn, KeyRound, Mail, Shield } from "lucide-react";

const ACTIVITY = [
  { icon: "logIn", title: "Signed in from Chrome on macOS", time: "Today, 9:14 AM" },
  { icon: "keyRound", title: "API key regenerated", time: "May 8, 2026" },
  { icon: "mail", title: "Email address verified", time: "Apr 28, 2026" },
  { icon: "shield", title: "Two-factor authentication enabled", time: "Apr 12, 2026" },
];

const ICON_MAP = { logIn: LogIn, keyRound: KeyRound, mail: Mail, shield: Shield };

export function RecentAccountActivityStrip() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Recent Account Activity</h3>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {ACTIVITY.map((a) => {
          const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
          return (
            <div key={a.title} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-200">{a.title}</p>
              <p className="mt-0.5 text-[10.5px] text-slate-500">{a.time}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}