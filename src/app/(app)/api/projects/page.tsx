"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCases } from "@/hooks/useCases";

export default function ProjectsListPage() {
  const { cases, loading, error } = useCases();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-400">Couldn&apos;t load projects: {error}</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
        <p className="mt-4 text-sm text-slate-500">No projects yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-white">Projects</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/projects/${c.id}`}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-colors hover:bg-slate-900/70"
          >
            <h2 className="font-semibold text-white">{c.name}</h2>
            {(c.category || c.country) && (
              <p className="mt-1 text-xs text-slate-500">
                {[c.category, c.country].filter(Boolean).join(" · ")}
              </p>
            )}
            {c.summary && (
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">{c.summary}</p>
            )}
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              {c.opportunity_score != null && <span>Opportunity: {c.opportunity_score}</span>}
              {c.competition_score != null && <span>Competition: {c.competition_score}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}