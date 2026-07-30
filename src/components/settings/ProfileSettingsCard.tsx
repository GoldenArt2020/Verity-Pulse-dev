"use client";

import { useState } from "react";
import { Camera, ChevronDown, CheckCircle2 } from "lucide-react";
import { PROFILE_SETTINGS } from "@/constants/settings";

export function ProfileSettingsCard() {
  const [name, setName] = useState(PROFILE_SETTINGS.fullName);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Profile</h3>

      <div className="mt-4 flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-700" />
            <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <button className="text-[11.5px] font-medium text-blue-400 hover:text-blue-300">Change Photo</button>
        </div>

        <div className="flex-1 space-y-3">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-[13px] text-white focus:border-blue-500/50 focus:outline-none"
            />
          </Field>

          <Field label="Email Address">
            <div className="relative">
              <input
                defaultValue={PROFILE_SETTINGS.email}
                readOnly
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 pr-20 text-[13px] text-slate-300 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-medium text-emerald-400">
                Verified <CheckCircle2 className="h-3 w-3" />
              </span>
            </div>
          </Field>

          <Field label="Timezone">
            <SelectLike value={PROFILE_SETTINGS.timezone} />
          </Field>
        </div>
      </div>

      <button className="mt-4 rounded-xl bg-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-600">
        Save Changes
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function SelectLike({ value }: { value: string }) {
  return (
    <button className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-[13px] text-white hover:bg-slate-800/40">
      {value} <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
    </button>
  );
}