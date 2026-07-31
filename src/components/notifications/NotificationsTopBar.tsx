"use client";

import { Search, Bell, HelpCircle, Zap, ChevronDown } from "lucide-react";

export function NotificationsTopBar() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-slate-400">Stay updated with important alerts, system updates and activity.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search cases, projects, alerts..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-14 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
        </div>

        <button className="relative rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800/50">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">18</span>
        </button>

        <button className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800/50">
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        <button className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
          <Zap className="h-4 w-4" /> Quick Actions <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}