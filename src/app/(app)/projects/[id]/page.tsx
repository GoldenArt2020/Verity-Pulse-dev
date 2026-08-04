// src/app/(app)/projects/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, FolderOpen } from "lucide-react";

type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

interface ProjectListItem {
  id: string;
  status: ProjectStatus;
  created_at: string;
  cases: {
    name: string;
    category: string | null;
    country: string | null;
    summary: string | null;
    opportunity_score: number | null;
    competition_score: number | null;
  } | null;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  on_hold: "bg-amber-500/15 text-amber-400",
  completed: "bg-blue-500/15 text-blue-400",
  archived: "bg-slate-500/15 text-slate-400",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/projects")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load projects");
        if (active) setProjects(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load projects");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
      <p className="mt-1 text-sm text-slate-500">Cases you&apos;ve saved to track.</p>

      {loading && (
        <div className="mt-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      )}

      {!loading && error && (
        <p className="mt-6 text-sm text-rose-400">Couldn&apos;t load projects: {error}</p>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/40 p-10 text-center">
          <FolderOpen className="h-6 w-6 text-slate-600" />
          <p className="text-sm text-slate-400">No projects saved yet.</p>
          <p className="text-xs text-slate-600">Save a case from its brief to track it here.</p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{p.cases?.name ?? "Untitled case"}</p>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              {(p.cases?.category || p.cases?.country) && (
                <p className="mt-1 text-xs text-slate-500">
                  {[p.cases?.category, p.cases?.country].filter(Boolean).join(" · ")}
                </p>
              )}
              {p.cases?.opportunity_score != null && (
                <p className="mt-3 text-xs text-slate-500">
                  Opportunity <span className="font-semibold text-white">{p.cases.opportunity_score}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}