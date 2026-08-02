"use client";
import type { LucideIcon } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/constants/routes";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useUIStore } from "@/store/useUIStore";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthUser();
  const { mobileNavOpen, closeMobileNav } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.email?.split("@")[0] ?? "Creator";

  const renderNavItem = (item: { label: string; href: string; icon: LucideIcon }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
          active
            ? "bg-violet-50 text-violet-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
            <path d="M12 2L3 6v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V6l-9-4z" />
          </svg>
        </div>
        <span className="font-display text-[16px] font-bold tracking-tight text-slate-900">
          VerityPulse
        </span>
        <button
          onClick={closeMobileNav}
          className="ml-auto text-slate-400 hover:text-slate-600 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {NAV_ITEMS.map(renderNavItem)}
        <div className="my-3 border-t border-slate-100" />
        {SECONDARY_NAV_ITEMS.map(renderNavItem)}
      </nav>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                <path d="M12 2l1.6 5.1L19 9l-5.1 1.6L12 16l-1.9-5.4L5 9l5.4-1.9L12 2z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-slate-800">Verity AI</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
            Your AI research partner working 24/7
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600">Online</span>
          </div>
        </div>

        <div className="relative border-t border-slate-100 pt-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-slate-50"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13px] font-semibold capitalize text-slate-900">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-400">Creator Plan</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-slate-100 bg-white p-1 shadow-lg">
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden h-screen w-[256px] shrink-0 flex-col border-r border-slate-100 bg-white md:flex">
        {content}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeMobileNav} />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-slate-100 bg-white">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}