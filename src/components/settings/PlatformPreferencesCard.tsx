"use client";

import {
  LayoutDashboard,
  Calendar,
  Clock,
  Coins,
  ListOrdered,
  Palette,
  ChevronDown,
} from "lucide-react";
import { PLATFORM_PREFERENCES } from "@/constants/settings";

const ICON_MAP = {
  layoutDashboard: LayoutDashboard,
  calendar: Calendar,
  clock: Clock,
  coins: Coins,
  listOrdered: ListOrdered,
  palette: Palette,
};

export function PlatformPreferencesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Platform Preferences</h3>

      <div className="mt-3 space-y-1">
        {PLATFORM_PREFERENCES.map((pref) => {
          const Icon = ICON_MAP[pref.icon as keyof typeof ICON_MAP];
          return (
            <div key={pref.label} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{pref.label}</p>
                  <p className="truncate text-[10.5px] text-slate-500">{pref.sub}</p>
                </div>
              </div>

              {pref.type === "select" ? (
                <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-300 hover:bg-slate-800/50">
                  {pref.value} <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-400">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="theme" defaultChecked className="h-3.5 w-3.5 accent-blue-500" />
                    Dark
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="theme" className="h-3.5 w-3.5 accent-blue-500" />
                    System
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}