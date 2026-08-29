"use client";

import { useEffect, useState } from "react";
import { Flame, ExternalLink, Loader2 } from "lucide-react";

interface TrendingUpdate {
  id: string;
  headline: string;
  url: string;
  source_name: string | null;
  published_at: string | null;
  summary: string | null;
  case_name: string | null;
  location: string | null;
  development_type: string | null;
  created_at: string;
}

function formatDevelopmentType(type: string | null): string {
  if (!type) return "Update";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TrendingUpdatesSection() {
  const [updates, setUpdates] = useState<TrendingUpdate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/trending-updates")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load trending updates");
        if (active) setUpdates(data.updates ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load trending updates");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-400">Couldn&apos;t load trending updates: {error}</p>;
  }

  if (!updates || updates.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-400" />
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Trending Right Now</h2>
      </div>
      <p className="mt-1 text-xs text-[#71717A]">
        Major developments in high-profile cases already in the news — verdicts, pleas, and breaking milestones.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {updates.map((update) => (
          <a
            key={update.id}
            href={update.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-orange-900/30 bg-orange-950/10 p-4 transition-colors hover:bg-orange-950/20"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                {formatDevelopmentType(update.development_type)}
              </span>
              <span className="shrink-0 text-[10px] text-[#71717A]">
                {timeAgo(update.published_at ?? update.created_at)}
              </span>
            </div>

            <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[#FAFAFA] group-hover:text-orange-300">
              {update.case_name ?? update.headline}
            </h3>

            {update.summary && (
              <p className="mt-1.5 line-clamp-2 text-xs text-[#A1A1AA]">{update.summary}</p>
            )}

            <div className="mt-3 flex items-center justify-between text-[10px] text-[#71717A]">
              <span>
                {update.source_name ?? "Source"}
                {update.location ? ` · ${update.location}` : ""}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}