"use client";

import { Search, Bell, HelpCircle, Zap, ChevronDown } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function TopBar({ title, subtitle, icon }: TopBarProps) {
  return (
    <header className="flex items-center gap-6 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-lg font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="relative ml-6 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search cases, keywords, people, locations..."
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-14 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-500">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="relative text-slate-400 hover:text-slate-200" aria-label="Notifications">
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
            3
          </span>
        </button>
        <button className="text-slate-400 hover:text-slate-200" aria-label="Help">
          <HelpCircle className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button className="flex items-center gap-2 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Zap className="h-4 w-4" strokeWidth={2} />
          Quick Actions
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}