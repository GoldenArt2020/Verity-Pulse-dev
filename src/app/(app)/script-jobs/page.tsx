"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, FileText, Clock, CheckCircle2 } from "lucide-react";

interface JobListItem {
  id: string;
  status: "waiting_for_claude" | "claimed" | "completed";
  word_count: number;
  created_at: string;
  source_material: { caseName: string; angleTitle: string };
}

const STATUS_LABEL: Record<JobListItem["status"], { label: string; icon: typeof Clock; className: string }> = {
  waiting_for_claude: { label: "Waiting for Claude", icon: Clock, className: "text-amber-400 bg-amber-500/10" },
  claimed: { label: "In progress", icon: Loader2, className: "text-blue-400 bg-blue-500/10" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-emerald-400 bg-emerald-500/10" },
};

export default function ScriptJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/script-jobs")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load jobs");
        setJobs(data.jobs ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="font-display text-lg font-bold text-white">Script Jobs</h1>
      <p className="mt-1 text-xs text-slate-500">
        Prepared for Claude — open a job, copy its prompt, and paste it into a Claude conversation to write it.
      </p>

      {loading && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        </div>
      )}

      {error && <p className="mt-6 text-sm text-rose-400">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/30 p-8 text-center">
          <FileText className="mx-auto h-5 w-5 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">
            No script jobs yet — prepare one from an angle in the Angle Builder.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {jobs.map((job) => {
          const status = STATUS_LABEL[job.status];
          const Icon = status.icon;
          return (
            <Link
              key={job.id}
              href={`/script-jobs/${job.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 transition-colors hover:bg-slate-900/70"
            >
              <div>
                <p className="text-sm font-medium text-white">{job.source_material.angleTitle}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {job.source_material.caseName} · {job.word_count.toLocaleString()} words
                </p>
              </div>
              <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${status.className}`}>
                <Icon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}