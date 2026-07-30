"use client";

import { CheckCircle2 } from "lucide-react";

export function SystemStatusCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">System Status</h3>

      <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-emerald-400">
        <CheckCircle2 className="h-4 w-4" /> All Systems Operational
      </div>
      <p className="mt-1 text-[10.5px] text-slate-500">Last updated: 2 min ago</p>
    </div>
  );
}