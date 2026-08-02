"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";

export function TopBar() {
  const { user } = useAuthUser();
  const [query, setQuery] = useState("");
  const displayName = user?.email?.split("@")[0] ?? "Creator";

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-8">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search anything..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-16 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-violet-300 focus:bg-white"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </div>

      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-semibold text-white">
          3
        </span>
      </button>

      <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-50">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200" />
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
    </header>
  );
}