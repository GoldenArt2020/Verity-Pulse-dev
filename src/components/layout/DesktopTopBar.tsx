"use client";

import { Search, Bell } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DesktopTopBar() {
  const { user } = useAuthUser();
  const displayName = user?.email?.split("@")[0] ?? "Creator";

  return (
    <div className="hidden items-center justify-end gap-4 border-b border-border bg-background px-8 py-4 md:flex">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search anything..."
          className="h-10 w-full rounded-xl border border-border bg-muted/50 pl-10 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:bg-background focus:outline-none"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <ThemeToggle />

      <button
        className="relative rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
          3
        </span>
      </button>

      <div className="h-9 w-9 shrink-0 rounded-full bg-muted" title={displayName} />
    </div>
  );
}