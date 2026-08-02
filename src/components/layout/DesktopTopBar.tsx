"use client";

import { Search, Bell } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";

export function DesktopTopBar() {
  const { user } = useAuthUser();
  const displayName = user?.email?.split("@")[0] ?? "Creator";

  return (
    <div className="hidden items-center justify-end gap-4 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4 md:flex">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search anything..."
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-14 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          ⌘K
        </kbd>
      </div>

      <button
        className="relative rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800/50"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
          3
        </span>
      </button>

      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-700" title={displayName} />
    </div>
  );
}