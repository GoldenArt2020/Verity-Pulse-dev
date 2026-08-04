"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

interface ProjectDetail {
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

const STATUS_OPTIONS: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    fetch(`/api/projects/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load project");
        if (active) setProject(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load project");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleStatusChange(newStatus: ProjectStatus) {
    if (!project) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <p className="mt-4 text-sm text-rose-400">
          Couldn&apos;t load project: {error ?? "Not found"}
        </p>
      </div>
    );
  }

  const c = project.cases;

  return (
    <div className="p-6">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {c?.name ?? "Untitled case"}
            </h1>
            {(c?.category || c?.country) && (
              <p className="mt-1 text-sm text-slate-500">
                {[c?.category, c?.country].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {c?.summary && (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{c.summary}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          {c?.opportunity_score != null && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">Opportunity Score</p>
              <p className="mt-1 font-mono-vp text-xl font-semibold text-white">
                {c.opportunity_score}
              </p>
            </div>
          )}
          {c?.competition_score != null && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">Competition Score</p>
              <p className="mt-1 font-mono-vp text-xl font-semibold text-white">
                {c.competition_score}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs text-slate-500">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                disabled={updating || s === project.status}
                onClick={() => handleStatusChange(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  s === project.status
                    ? STATUS_STYLES[s]
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Saved{" "}
          {new Date(project.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}