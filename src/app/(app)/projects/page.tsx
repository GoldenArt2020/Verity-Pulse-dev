"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

type RealStatus =
  | "IDEA" | "RESEARCH" | "NARRATIVE" | "SEO" | "THUMBNAIL"
  | "RECORDING" | "EDITING" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type Bucket = "ongoing" | "finished";

const FINISHED_STATUSES: RealStatus[] = ["PUBLISHED", "ARCHIVED"];

function toBucket(status: RealStatus): Bucket {
  return FINISHED_STATUSES.includes(status) ? "finished" : "ongoing";
}

interface ProjectRow {
  id: string;
  status: RealStatus;
  created_at: string;
  case_id: string;
  cases: {
    name: string;
    category: string | null;
    country: string | null;
    summary: string | null;
    opportunity_score: number | null;
    competition_score: number | null;
  } | null;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Bucket>("all");
  const [movingId, setMovingId] = useState<string | null>(null);

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
    const base = { all: projects.length, ongoing: 0, finished: 0 };
    for (const p of projects) {
      base[toBucket(p.status)] += 1;
    }
    return base;
  }, [projects]);

  const filtered =
    filter === "all" ? projects : projects.filter((p) => toBucket(p.status) === filter);

  async function handleMarkFinished(projectId: string) {
    setMovingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update project");
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: data.status } : p)));
    } catch {
      // silent — could add a toast here later
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">Cases you&apos;ve saved to actively work on.</p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-800/60">
        {(["all", "ongoing", "finished"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === key
                ? "border-b-2 border-blue-500 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      )}

      {error && <p className="p-6 text-sm text-rose-400">Couldn&apos;t load projects: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-12 text-center">
          <p className="text-sm text-slate-400">
            {projects.length === 0
              ? "No projects yet — build an angle and save it to get started."
              : "No projects match this filter."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const bucket = toBucket(p.status);
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-colors hover:bg-slate-900/70"
              >
                <Link href={`/projects/${p.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-white">{p.cases?.name ?? "Untitled case"}</h2>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                        bucket === "finished"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {bucket === "finished" ? "Finished" : "Ongoing"}
                    </span>
                  </div>
                  {(p.cases?.category || p.cases?.country) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {[p.cases?.category, p.cases?.country].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {p.cases?.summary && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-400">{p.cases.summary}</p>
                  )}
                  <div className="mt-4 flex gap-4 text-xs text-slate-500">
                    {p.cases?.opportunity_score != null && <span>Opportunity: {p.cases.opportunity_score}</span>}
                    {p.cases?.competition_score != null && <span>Competition: {p.cases.competition_score}</span>}
                  </div>
                </Link>

                {bucket === "ongoing" && (
                  <button
                    onClick={() => handleMarkFinished(p.id)}
                    disabled={movingId === p.id}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
                  >
                    {movingId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {movingId === p.id ? "Moving..." : "Mark as Finished"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}