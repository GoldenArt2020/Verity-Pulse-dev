"use client";

import { useState } from "react";
import { Save, Moon, Wand2, Volume2, FlaskConical } from "lucide-react";
import { SYSTEM_PREFERENCES } from "@/constants/settings";

const ICON_MAP = { save: Save, moon: Moon, wand: Wand2, volume: Volume2, flaskConical: FlaskConical };

function ToggleRow({ icon, label, sub, enabled }: { icon: string; label: string; sub: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const Icon = ICON_MAP[icon as keyof typeof ICON_MAP];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-slate-200">{label}</p>
          <p className="truncate text-[10.5px] text-slate-500">{sub}</p>
        </div>
      </div>

      <button
        onClick={() => setOn((v) => !v)}
        className={`h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-blue-500" : "bg-slate-700"}`}
      >
        <span
          className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SystemPreferencesCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">System Preferences</h3>

      <div className="mt-3 space-y-1">
        {SYSTEM_PREFERENCES.map((pref) => (
          <ToggleRow key={pref.label} icon={pref.icon} label={pref.label} sub={pref.sub} enabled={pref.enabled} />
        ))}
      </div>

      <button className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-[12.5px] font-medium text-blue-400 hover:bg-slate-800/40">
        Reset to Defaults
      </button>
    </div>
  );
}