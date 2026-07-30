"use client";

import { Pencil, MapPin, Mail, CheckCircle2, ExternalLink } from "lucide-react";
import { PROFILE_HEADER } from "@/constants/userProfile";

export function ProfileHeaderCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700" />
          <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-slate-300 hover:bg-slate-700">
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-white">{PROFILE_HEADER.name}</h2>
          <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
            {PROFILE_HEADER.planBadge}
          </span>
        </div>
        <p className="text-[12.5px] text-slate-400">{PROFILE_HEADER.title}</p>

        <div className="mt-2 flex items-center gap-1 text-[11.5px] text-slate-500">
          <MapPin className="h-3 w-3" /> {PROFILE_HEADER.location}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <Mail className="h-3 w-3" /> {PROFILE_HEADER.email}
          {PROFILE_HEADER.emailVerified && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              Verified <CheckCircle2 className="h-3 w-3" />
            </span>
          )}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{PROFILE_HEADER.bio}</p>

        <button className="mt-4 w-full rounded-xl border border-slate-800 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/40">
          Change Photo
        </button>

        <div className="mt-2 flex w-full gap-2">
          <button className="flex-1 rounded-xl bg-blue-500 py-2 text-[12.5px] font-semibold text-white hover:bg-blue-600">
            Edit Profile
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-800 py-2 text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/40">
            View Public Profile <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}