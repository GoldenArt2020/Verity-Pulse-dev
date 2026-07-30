"use client";

import { CheckCircle2 } from "lucide-react";
import { SUBSCRIPTION } from "@/constants/userProfile";

export function SubscriptionCard() {
  const pct = Math.round((SUBSCRIPTION.daysRemaining / SUBSCRIPTION.totalDays) * 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Subscription</h3>
        <button className="text-[11px] font-medium text-blue-400 hover:text-blue-300">Manage</button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[15px] font-bold text-white">{SUBSCRIPTION.plan}</span>
        <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          {SUBSCRIPTION.status}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Next billing date: {SUBSCRIPTION.nextBilling}</p>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-[10.5px] text-slate-500">{SUBSCRIPTION.daysRemaining} days remaining</p>

      <div className="mt-3 space-y-1.5">
        {SUBSCRIPTION.perks.map((perk) => (
          <div key={perk} className="flex items-center gap-1.5 text-[11.5px] text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {perk}
          </div>
        ))}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-1 text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Billing &amp; Plans →
      </button>
    </div>
  );
}