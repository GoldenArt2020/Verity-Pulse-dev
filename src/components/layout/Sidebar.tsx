"use client";
import type { LucideIcon } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, LogOut, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/constants/routes";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useUIStore } from "@/store/useUIStore";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthUser();
  const { sidebarCollapsed: collapsed, toggleSidebar, mobileNavOpen, closeMobileNav } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.email?.split("@")[0] ?? "Creator";
  console.log("Sidebar user state:", user);

  async function handleSignOut() {
    console.log("Sign out clicked, calling signOut()...");
    await signOut();
    console.log("signOut() finished, redirecting...");
    router.push("/");
  }

  const renderNavItem = (item: { label: string; href: string; icon: LucideIcon }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
          collapsed ? "justify-center px-0" : ""
        } ${
          active
            ? "bg-brand/10 text-brand"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="flex-1">{item.label}</span>}
      </Link>
    );
  };

  const content = (
    <>
      <div className={`flex items-center gap-2.5 px-5 py-6 ${collapsed ? "justify-center px-0" : ""}`}>
        <Image src="/verity-pulse-icon.png" alt="VerityPulse" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
        {!collapsed && (
          <span className="font-display text-[16px] font-bold tracking-tight text-sidebar-foreground">
            VerityPulse
          </span>
        )}
        <button
          onClick={closeMobileNav}
          className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {NAV_ITEMS.map(renderNavItem)}
        <div className="my-3 border-t border-sidebar-border" />
        {SECONDARY_NAV_ITEMS.map(renderNavItem)}
      </nav>

      <div className="space-y-3 p-4">
        {!collapsed && (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-brand-foreground" fill="currentColor">
                  <path d="M12 2l1.6 5.1L19 9l-5.1 1.6L12 16l-1.9-5.4L5 9l5.4-1.9L12 2z" />
                </svg>
              </div>
              <span className="text-[13px] font-semibold text-sidebar-foreground">Verity AI</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-sidebar-foreground/60">
              Your AI research partner working 24/7
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-600">Online</span>
            </div>
          </div>
        )}

        <div className={`relative border-t border-sidebar-border pt-3 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={() => !collapsed && setMenuOpen((v) => !v)}
            className={`flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-sidebar-accent ${
              collapsed ? "justify-center" : "w-full"
            }`}
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sidebar-accent" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] font-semibold capitalize text-sidebar-foreground">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/50">Creator Plan</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
              </>
            )}
          </button>

          {menuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-lg">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:flex ${
          collapsed ? "w-20" : "w-[256px]"
        }`}
      >
        {content}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeMobileNav} />
          <aside className="relative flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}