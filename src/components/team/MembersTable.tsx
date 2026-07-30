"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { TEAM_MEMBERS } from "@/constants/team";
import { MemberRow } from "./MemberRow";

export function MembersTable() {
  const [page, setPage] = useState(1);
  const totalPages = 3;

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-[11px] font-medium uppercase text-slate-500">
            <th className="px-2 py-3">Member</th>
            <th className="px-2 py-3">Role</th>
            <th className="px-2 py-3">Team</th>
            <th className="px-2 py-3">Projects</th>
            <th className="px-2 py-3">Tasks</th>
            <th className="px-2 py-3">Workload</th>
            <th className="px-2 py-3">Status</th>
            <th className="px-2 py-3">Last Active</th>
            <th className="px-2 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {TEAM_MEMBERS.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-3">
        <p className="text-[12px] text-slate-500">Showing 1 to 8 of 18 members</p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 disabled:opacity-40"
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-7 w-7 rounded-lg text-[12px] font-medium ${
                page === n ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 disabled:opacity-40"
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button className="flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1.5 text-[12px] text-slate-400 hover:bg-slate-800/50">
          10 per page <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}