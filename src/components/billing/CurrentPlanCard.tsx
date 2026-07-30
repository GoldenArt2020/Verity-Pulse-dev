"use client";

import { ChevronDown } from "lucide-react";

export function CurrentPlanCard() {
  return (
    <div className="glass-card relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900/60 to-slate-900/60 p-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ACTIVE
      </span>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">VerityPulse Pro</h2>
          <p className="mt-1 text-sm text-slate-400">Professional AI-powered creator intelligence</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">
            $49<span className="text-sm font-medium text-slate-400"> / month</span>
          </p>
          <span className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10.5px] text-slate-400">Billed Monthly</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px] text-slate-300">
        {["Unlimited Opportunity Searches", "AI Insights & Recommendations", "Advanced Case Analysis", "Up to 10 Team Members", "Premium Integrations"].map((f) => (
          <div key={f} className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span> {f}
          </div>
        ))}
      </div>

      <button className="mt-5 flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">
        Manage Subscription <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}