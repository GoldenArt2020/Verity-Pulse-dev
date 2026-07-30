"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

function checkTwoFactorEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("vp_2fa_enabled") === "true";
}

export function TwoFactorPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("vp_2fa_prompt_dismissed");
    if (!checkTwoFactorEnabled() && !dismissed) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("vp_2fa_prompt_dismissed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-white">Secure your account</h3>
            <p className="mt-1 text-[12.5px] text-slate-400">
              Two-factor authentication is not enabled yet. We recommend turning it on to protect your account.
            </p>
          </div>
          <button onClick={dismiss} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl border border-slate-700 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50"
          >
            Remind me later
          </button>
          <a
            href="/settings"
            onClick={dismiss}
            className="flex-1 rounded-xl bg-blue-500 py-2 text-center text-[12.5px] font-semibold text-white hover:bg-blue-600"
          >
            Enable now
          </a>
        </div>
      </div>
    </div>
  );
}