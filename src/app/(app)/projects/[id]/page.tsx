"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectAngleTabs } from "@/components/projects/ProjectAngleTabs";

type ProjectStatus =
  | "IDEA" | "RESEARCH" | "NARRATIVE" | "SEO" | "THUMBNAIL"
  | "RECORDING" | "EDITING" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

interface ProjectDetail {
  id: string;
  status: ProjectStatus;
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

const STATUS_OPTIONS: ProjectStatus[] = [
  "IDEA", "RESEARCH", "NARRATIVE", "SEO", "THUMBNAIL",
  "RECORDING", "EDITING", "SCHEDULED", "PUBLISHED", "ARCHIVED",
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  IDEA: "Idea",
  RESEARCH: "Research",
  NARRATIVE: "Narrative",
  SEO: "SEO",
  THUMBNAIL: "Thumbnail",
  RECORDING: "Recording",
  EDITING: "Editing",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  IDEA: "bg-slate-500/15 text-slate-400",
  RESEARCH: "bg-sky-500/15 text-sky-400",
  NARRATIVE: "bg-violet-500/15 text-violet-400",
  SEO: "bg-fuchsia-500/15 text-fuchsia-400",
  THUMBNAIL: "bg-pink-500/15 text-pink-400",
  RECORDING: "bg-orange-500/15 text-orange-400",
  EDITING: "bg-amber-500/15 text-amber-400",
  SCHEDULED: "bg-cyan-500/15 text-cyan-400",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400",
  ARCHIVED: "bg-slate-500/15 text-slate-400",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!project || newStatus === project.status) return;
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
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this project? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete project");
      toast.success("Project removed");
      router.push("/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <p className="mt-6 text-sm text-rose-400">
          Couldn&apos;t load project: {error ?? "Not found"}
        </p>
      </div>
    );
  }

  const c = project.cases;

  return (
    <div className="p-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{c?.name ?? "Untitled case"}</h1>
          {(c?.category || c?.country) && (
            <p className="mt-1 text-sm text-slate-500">
              {[c?.category, c?.country].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[project.status]}`}>
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      {c?.summary && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">{c.summary}</p>
      )}

      <div className="mt-6 flex gap-4">
        {c?.opportunity_score != null && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-500">Opportunity</p>
            <p className="mt-1 text-xl font-semibold text-white">{c.opportunity_score}</p>
          </div>
        )}
        {c?.competition_score != null && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-500">Competition</p>
            <p className="mt-1 text-xl font-semibold text-white">{c.competition_score}</p>
            <p className="mt-0.5 text-[10px] text-slate-600">Lower is better</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-xs text-slate-500">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => handleStatusChange(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                s === project.status
                  ? STATUS_STYLES[s]
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {project.case_id && <ProjectAngleTabs caseId={project.case_id} />}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="mt-10 inline-flex items-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/50 disabled:opacity-50"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Remove project
      </button>
    </div>
  );
}