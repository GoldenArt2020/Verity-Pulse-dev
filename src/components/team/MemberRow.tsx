"use client";

import { Mail, MoreVertical } from "lucide-react";
import { TeamMember, STATUS_DOT_COLOR } from "@/constants/team";

export function MemberRow({ member }: { member: TeamMember }) {
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
      <td className="px-2 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-700" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-medium text-white">{member.name}</p>
              {member.isYou && (
                <span className="rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                  You
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-slate-500">{member.email}</p>
          </div>
        </div>
      </td>

      <td className="px-2 py-3">
        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${member.roleColor}`}>
          {member.role}
        </span>
      </td>

      <td className="px-2 py-3 text-[12.5px] text-slate-300">{member.team}</td>
      <td className="px-2 py-3 text-[12.5px] text-slate-300">{member.projects}</td>
      <td className="px-2 py-3 text-[12.5px] text-slate-300">
        {member.tasksCompleted} / {member.tasksTotal}
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <span className="w-8 text-[11px] font-medium text-slate-300">{member.workload}%</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full rounded-full ${member.workloadColor}`} style={{ width: `${member.workload}%` }} />
          </div>
        </div>
      </td>

      <td className="px-2 py-3">
        <span className="flex items-center gap-1.5 text-[12px] text-slate-300">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLOR[member.status]}`} />
          {member.status}
        </span>
      </td>

      <td className="px-2 py-3 text-[11.5px] text-slate-500">{member.lastActive}</td>

      <td className="px-2 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <Mail className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}