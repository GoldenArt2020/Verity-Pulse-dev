"use client";
import type { LucideIcon } from "lucide-react";

// ...

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, LogOut, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/constants/routes";
import { Logo } from "@/components/homepage/Logo";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useUIStore } from "@/store/useUIStore";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthUser();
  const { sidebarCollapsed: collapsed, toggleSidebar, mobileNavOpen, closeMobileNav } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.signInDetails?.loginId?.split("@")[0] ?? "Creator";

  useEffect(() => {
    if (collapsed) setMenuOpen(false);
  }, [collapsed]);

  useEffect(() => {
    closeMobileNav();
  }, [pathname]);

  
const renderNavItem = (item: { label: string; href: string; icon: LucideIcon }) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          active
            ? "bg-blue-500/15 text-blue-400"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && item.label}
      </Link>
    );
  };

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-7 w-7 shrink-0" />
        {!collapsed && (
          <span className="font-display text-[15px] font-bold tracking-wide text-white">
            VERITYPULSE
          </span>
        )}
        <button
          onClick={closeMobileNav}
          className="ml-auto text-slate-500 hover:text-slate-300 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(renderNavItem)}

        <div className="my-3 border-t border-slate-800/60" />

        {SECONDARY_NAV_ITEMS.map(renderNavItem)}
      </nav>

      <div className="border-t border-slate-800/60 p-3">
        {!collapsed && (
          <div className="rounded-xl bg-slate-900/60 p-3">
            <p className="text-[11px] text-slate-500">Your Plan</p>
            <p className="text-sm font-semibold text-white">VerityPulse Pro</p>
            <p className="text-[11px] text-slate-500">Renews Jan 24, 2026</p>
            <button className="mt-3 w-full rounded-lg bg-blue-500 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
              Manage Plan
            </button>
          </div>
        )}

        <div className="relative mt-3">
          <button
            onClick={() => !collapsed && setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-slate-800/40"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-700" />
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-medium capitalize text-white">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500">Creator</p>
              </div>
            )}
            {!collapsed && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
          </button>

          {menuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-lg">
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="mt-2 hidden w-full items-center justify-center rounded-lg px-1 py-2 text-slate-500 hover:text-slate-300 md:flex"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden h-screen shrink-0 flex-col border-r border-slate-800/60 bg-[rgb(4,9,22)] transition-all duration-200 md:flex ${
          collapsed ? "w-20" : "w-[248px]"
        }`}
      >
        {content}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobileNav} />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-slate-800/60 bg-[rgb(4,9,22)]">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}