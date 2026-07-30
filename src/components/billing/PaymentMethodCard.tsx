"use client";

import { INVOICES } from "@/constants/billing";

export function PaymentMethodCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Payment Method</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">Manage →</button>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-11 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold text-white">VISA</div>
          <div>
            <p className="text-[12.5px] font-medium text-slate-200">•••• 4242</p>
            <p className="text-[10.5px] text-slate-500">Expires 12/2026</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">Default</span>
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        Update Payment Method
      </button>

      <div className="mt-5 border-t border-slate-800/60 pt-4">
        <h4 className="text-[13px] font-semibold text-white">Invoices</h4>
        <div className="mt-2 space-y-2">
          {INVOICES.map((inv) => (
            <div key={inv.date} className="flex items-center justify-between text-[12px]">
              <span className="text-slate-400">{inv.date}</span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-300">{inv.amount}</span>
                <button className="text-blue-400 hover:text-blue-300">Download</button>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-3 text-[12px] font-medium text-blue-400 hover:text-blue-300">View All Invoices →</button>
      </div>
    </div>
  );
}