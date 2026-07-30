"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { SECURITY_STATUS } from "@/constants/userProfile";

export function SecurityStatusCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Security Status</h3>
        <span className="text-[11px] font-semibold text-emerald-400">Secure</span>
      </div>

      <div className="mt-3 flex items-center justify-center py-2">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-500/20">
          <div className="absolute inset-2 rounded-full border-2 border-emerald-500/40" />
          <ShieldCheck className="h-9 w-9 text-emerald-400" strokeWidth={1.5} />
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {SECURITY_STATUS.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-[11.5px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {item.label}
            </span>
            <span className="font-medium text-emerald-400">{item.value}</span>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        Manage Security
      </button>
    </div>
  );
}