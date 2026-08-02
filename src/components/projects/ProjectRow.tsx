"use client";

import { MoreVertical } from "lucide-react";
import { Project, STATUS_BADGE_COLOR, PROGRESS_BAR_COLOR } from "@/constants/projects";
import { TeamAvatarStack } from "./TeamAvatarStack";

export function ProjectRow({ project }: { project: Project }) {
  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-2 py-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
            <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">{project.name}</p>
            <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${project.subtitleColor}`}>
              {project.subtitle}
            </span>
          </div>
        </div>
      </td>

      <td className="px-2 py-3 text-[12.5px] text-foreground/80">
        <div className="font-medium">{project.cases}</div>
        <div className="text-[10.5px] text-muted-foreground">{project.cases} cases</div>
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${PROGRESS_BAR_COLOR[project.status]}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="text-[11.5px] font-medium text-foreground/80">{project.progress}%</span>
        </div>
      </td>

      <td className="px-2 py-3">
        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${STATUS_BADGE_COLOR[project.status]}`}>
          {project.status}
        </span>
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          <span className="text-[12px] text-foreground/80">{project.owner}</span>
        </div>
      </td>

      <td className="px-2 py-3">
        <TeamAvatarStack count={project.teamAvatars} extra={project.extraMembers} />
      </td>

      <td className="px-2 py-3 text-[11.5px] text-muted-foreground">
        <div>{project.updated}</div>
        <div>{project.updatedTime}</div>
      </td>

      <td className="px-2 py-3 text-right">
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}