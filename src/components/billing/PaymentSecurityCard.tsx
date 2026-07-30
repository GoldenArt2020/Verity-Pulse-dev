"use client";

import { ShieldCheck } from "lucide-react";
import { PAYMENT_SECURITY } from "@/constants/billing";

export function PaymentSecurityCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <h3 className="text-[14px] font-semibold text-white">Payment & Security</h3>
      </div>

      <p className="mt-2 text-[11.5px] text-slate-400">Your payment information is protected with enterprise-grade security.</p>

      <div className="mt-3 space-y-2">
        {PAYMENT_SECURITY.map((item) => (
          <div key={item} className="flex items-center gap-2 text-[12px] text-slate-300">
            <span className="text-emerald-400">✓</span> {item}
          </div>
        ))}
      </div>
    </div>
  );
}