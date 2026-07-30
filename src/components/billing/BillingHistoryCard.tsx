"use client";

import { FileText } from "lucide-react";
import { BILLING_HISTORY } from "@/constants/billing";

export function BillingHistoryCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Billing History</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All →</button>
      </div>

      <div className="mt-3 space-y-1">
        {BILLING_HISTORY.map((b) => (
          <div key={b.date} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12.5px] font-medium text-slate-200">{b.date}</p>
                <p className="text-[11px] text-slate-500">{b.desc}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400">Paid</span>
          </div>
        ))}
      </div>
    </div>
  );
}