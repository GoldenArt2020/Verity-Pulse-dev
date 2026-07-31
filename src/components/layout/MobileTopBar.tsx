"use client";

import { Menu } from "lucide-react";
import { Logo } from "@/components/homepage/Logo";
import { useUIStore } from "@/store/useUIStore";

export function MobileTopBar() {
  const { toggleMobileNav } = useUIStore();

  return (
    <div className="flex items-center gap-3 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-4 py-3 md:hidden">
      <button onClick={toggleMobileNav} className="text-slate-300" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <Logo className="h-6 w-6" />
      <span className="font-display text-sm font-bold text-white">VERITYPULSE</span>
    </div>
  );
}