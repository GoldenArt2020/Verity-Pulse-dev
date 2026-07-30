"use client";

import { Key, ShieldCheck, Monitor, BellRing, Code2, Smartphone } from "lucide-react";
import { SECURITY_SETTINGS } from "@/constants/settings";

const ICON_MAP = {
  key: Key,
  shieldCheck: ShieldCheck,
  monitor: Monitor,
  bellRing: BellRing,
  code: Code2,
  smartphone: Smartphone,
};

interface SecuritySettingsCardProps {
  only?: string[];
}

export function SecuritySettingsCard({ only }: SecuritySettingsCardProps) {
  const items = only
    ? SECURITY_SETTINGS.filter((item) => only.includes(item.label))
    : SECURITY_SETTINGS;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Security</h3>

      <div className="mt-3 space-y-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
          return (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{item.label}</p>
                  <p className="truncate text-[10.5px] text-slate-500">{item.sub}</p>
                </div>
              </div>

              {item.action ? (
                <button className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-[11.5px] font-medium text-slate-300 hover:bg-slate-800/50">
                  {item.action}
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-emerald-400">
                  {item.status}
                  {item.status?.includes("Enabled") && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}