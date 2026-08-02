"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { PROJECTS } from "@/constants/projects";
import { ProjectRow } from "./ProjectRow";

export function ProjectsTable() {
  const [page, setPage] = useState(1);
  const totalPages = 3;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium uppercase text-muted-foreground">
            <th className="px-2 py-3">Project</th>
            <th className="px-2 py-3">Cases</th>
            <th className="px-2 py-3">Progress</th>
            <th className="px-2 py-3">Status</th>
            <th className="px-2 py-3">Owner</th>
            <th className="px-2 py-3">Team</th>
            <th className="px-2 py-3">Updated</th>
            <th className="px-2 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {PROJECTS.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-[12px] text-muted-foreground">Showing 1 to 8 of 23 projects</p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-7 w-7 rounded-lg text-[12px] font-medium ${
                page === n ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-muted">
          10 per page <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}