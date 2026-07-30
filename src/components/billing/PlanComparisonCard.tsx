"use client";

import { PLANS } from "@/constants/billing";

export function PlanComparisonCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
      <h3 className="text-[15px] font-semibold text-white">Plan Comparison</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-5 ${
              plan.popular ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 bg-slate-900/60"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-semibold text-white">
                Most Popular
              </span>
            )}

            <p className="text-[13px] font-semibold text-slate-300">{plan.name}</p>
            <p className="mt-2 text-2xl font-bold text-white">{plan.price}</p>
            <p className="mt-1 text-[11.5px] text-slate-500">{plan.desc}</p>

            <div className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[12px] text-slate-300">
                  <span className="text-emerald-400">✓</span> {f}
                </div>
              ))}
            </div>

            <button
              className={`mt-5 w-full rounded-xl py-2.5 text-[12.5px] font-semibold ${
                plan.popular
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "border border-slate-700 text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}