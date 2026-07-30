"use client";

import { Calendar } from "lucide-react";

export function NextBillingCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
      <h3 className="text-[14px] font-semibold text-white">Next Billing</h3>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">Jan 24, 2026</p>
          <p className="text-[12px] text-slate-400">Next charge: $49.00</p>
        </div>
      </div>

      <button className="mt-5 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        View Invoices
      </button>
    </div>
  );
}