"use client";

import { Download, Shield, Database, Trash2 } from "lucide-react";
import { DATA_PRIVACY } from "@/constants/settings";

const ICON_MAP = { download: Download, shield: Shield, database: Database, trash: Trash2 };

export function DataPrivacyCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Data &amp; Privacy</h3>

      <div className="mt-3 space-y-1">
        {DATA_PRIVACY.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
          const isDanger = item.action === "Clear";
          return (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{item.label}</p>
                  <p className="truncate text-[10.5px] text-slate-500">{item.sub}</p>
                </div>
              </div>

              <button
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11.5px] font-medium hover:bg-slate-800/50 ${
                  isDanger ? "border-rose-800/60 text-rose-400" : "border-slate-700 text-slate-300"
                }`}
              >
                {item.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}