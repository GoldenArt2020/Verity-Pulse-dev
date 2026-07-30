"use client";

import { Briefcase, Shield, User, Hash, Clock, Globe, ChevronRight, Copy } from "lucide-react";
import { ACCOUNT_WORKSPACE } from "@/constants/userProfile";

const ICON_MAP = { briefcase: Briefcase, shield: Shield, user: User, hash: Hash, clock: Clock, globe: Globe };

export function AccountWorkspaceCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Account &amp; Workspace</h3>

      <div className="mt-3 space-y-1">
        {ACCOUNT_WORKSPACE.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
          return (
            <button
              key={item.label}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-[12.5px] text-slate-400">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-medium text-slate-200">{item.value}</span>
                {item.copyable ? (
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}