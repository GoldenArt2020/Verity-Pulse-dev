"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

interface ProjectRow {
  id: string;
  status: ProjectStatus;
  created_at: string;
  cases: {
    name: string;
    category: string | null;
    country: string | null;
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

const FILTERS: { key: "all" | ProjectStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "on_hold", label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

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

  const counts = useMemo(() => {
    const base: Record<"all" | ProjectStatus, number> = {
      all: projects.length,
      active: 0,
      on_hold: 0,
      completed: 0,
      archived: 0,
    };
    for (const p of projects) {
      base[p.status] = (base[p.status] ?? 0) + 1;
    }
    return base;
  }, [projects]);

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cases you&apos;ve saved to actively work on.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-800/60">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? "border-b-2 border-blue-500 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      )}

      {error && (
        <p className="p-6 text-sm text-rose-400">Couldn&apos;t load projects: {error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-12 text-center">
          <p className="text-sm text-slate-400">
            {projects.length === 0
              ? "No projects yet — save a case from Discover to get started."
              : "No projects match this filter."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Case</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-800/40 bg-slate-900/20 last:border-0 hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="block">
                      <p className="font-medium text-white hover:text-blue-400">
                        {p.cases?.name ?? "Untitled case"}
                      </p>
                      {(p.cases?.category || p.cases?.country) && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[p.cases?.category, p.cases?.country].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}