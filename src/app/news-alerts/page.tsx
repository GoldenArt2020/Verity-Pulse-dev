// src/app/news-alerts/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2, ExternalLink, Check, X, Radio } from "lucide-react";

interface CaseAlert {
  id: string;
  provider: string;
  source_country: string | null;
  headline: string;
  url: string;
  source_name: string | null;
  published_at: string | null;
  summary: string | null;
  case_name: string | null;
  location: string | null;
  matched_case_id: string | null;
  status: "pending" | "promoted" | "dismissed";
  created_at: string;
}

type StatusFilter = "pending" | "promoted" | "dismissed" | "all";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NewsAlertsPage() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [alerts, setAlerts] = useState<CaseAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/alerts?status=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load alerts");
      setAlerts(data.alerts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePromote(id: string) {
    setActingOnId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/news/alerts/${id}/promote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to promote alert");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to promote alert");
    } finally {
      setActingOnId(null);
    }
  }

  async function handleDismiss(id: string) {
    setActingOnId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/news/alerts/${id}/dismiss`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to dismiss alert");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to dismiss alert");
    } finally {
      setActingOnId(null);
    }
  }

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "promoted", label: "Promoted" },
    { key: "dismissed", label: "Dismissed" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <Link href="/discover" className="text-slate-400 hover:text-slate-200">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-blue-400" />
          <div>
            <h1 className="font-display text-lg font-bold text-white">News Alerts</h1>
            <p className="text-xs text-slate-500">Murder cases detected from live news coverage, awaiting review.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-blue-500 text-white"
                  : "bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />
            ))}
          </div>
        )}

        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && alerts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Radio className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-500">
              {filter === "pending" ? "No pending alerts right now." : `No ${filter} alerts.`}
            </p>
          </div>
        )}

        {!loading && !error && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{a.case_name || a.headline}</p>
                      {a.location && (
                        <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {a.location}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                        {a.provider}
                      </span>
                    </div>

                    <p className="mt-1 text-[13px] text-slate-400">{a.headline}</p>

                    {a.summary && (
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{a.summary}</p>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{a.source_name ?? "Unknown source"}</span>
                      <span>Â·</span>
                      <span>{timeAgo(a.published_at ?? a.created_at)}</span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                      >
                        Read source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {a.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDismiss(a.id)}
                          disabled={actingOnId === a.id}
                          className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-800/60 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" /> Dismiss
                        </button>
                        <button
                          onClick={() => handlePromote(a.id)}
                          disabled={actingOnId === a.id}
                          className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
                        >
                          {actingOnId === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Promote to Case
                        </button>
                      </div>
                    )}

                    {a.status === "promoted" && a.matched_case_id && (
                      <Link
                        href={`/angle-builder/${a.matched_case_id}`}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/25"
                      >
                        View Case <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}

                    {a.status === "dismissed" && (
                      <span className="rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                        Dismissed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}