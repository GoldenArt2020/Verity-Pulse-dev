"use client";

import { Menu } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function MobileTopBar() {
  const { toggleMobileNav } = useUIStore();

  return (
    <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
      <button onClick={toggleMobileNav} className="text-muted-foreground" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-foreground" fill="currentColor">
          <path d="M12 2L3 6v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V6l-9-4z" />
        </svg>
      </div>
      <span className="font-display text-sm font-bold text-foreground">VerityPulse</span>
    </div>
  );
}