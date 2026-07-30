"use client";

import { KeyRound } from "lucide-react";
import { API_KEYS } from "@/constants/userProfile";

export function APIKeysCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">API Keys</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-3">
        {API_KEYS.map((key) => (
          <div key={key.label} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-slate-200">{key.label}</span>
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                {key.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono-vp text-[11.5px] text-slate-400">
              <KeyRound className="h-3.5 w-3.5 text-slate-500" /> {key.masked}
            </div>
            <p className="mt-1 text-[10.5px] text-slate-500">{key.created}</p>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        Manage API Keys
      </button>
    </div>
  );
}