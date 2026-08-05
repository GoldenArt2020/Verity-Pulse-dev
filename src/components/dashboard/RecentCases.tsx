"use client";

import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useCases } from "@/hooks/useCases";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentCases() {
  const router = useRouter();
  const { cases, loading } = useCases();

  const researched = [...cases]
    .filter((c) => (c.opportunity_score ?? 0) > 0 && c.summary)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="col-span-full h-64 animate-pulse rounded-2xl bg-slate-900/40" />;
  }

  if (researched.length === 0) {
    return (
      <div className="glass-card col-span-full rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-center text-sm text-slate-400">
        No cases researched yet.
      </div>
    );
  }

  return (
    <div className="glass-card col-span-1 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 lg:col-span-3">
      <h3 className="text-base font-semibold text-white">Recent Cases Analyzed</h3>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {researched.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/case-analyzer/${c.id}`)}
            className="group cursor-pointer rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 transition-all hover:-translate-y-1 hover:border-blue-500/30"
          >
            <div className="relative h-20 w-full rounded-lg bg-slate-800">
              <span className="absolute right-1.5 top-1.5 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                {c.opportunity_score}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] font-medium text-white">{c.name}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.country}</p>
            <span className="mt-2 inline-block rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              {c.category}
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {c.created_at ? `Researched ${timeAgo(c.created_at)}` : ""}
              </span>
              <Bookmark className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}