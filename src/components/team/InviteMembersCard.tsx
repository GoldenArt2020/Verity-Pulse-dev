"use client";

import { Link2, UserPlus } from "lucide-react";

export function InviteMembersCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Invite Members</h3>
        <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-600">
          <UserPlus className="h-3.5 w-3.5" /> Invite Members
        </button>
      </div>

      <p className="mt-2 text-[11.5px] text-slate-500">Add new members to your workspace.</p>

      <button className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-blue-400 hover:text-blue-300">
        Copy Invite Link <Link2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}