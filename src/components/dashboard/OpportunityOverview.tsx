"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";

export function OpportunityOverview() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) return <div className="col-span-full h-64 animate-pulse rounded-2xl bg-slate-900/40" />;
  if (error || !stats) {
    return (
      <div className="glass-card col-span-full rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-sm text-slate-400">
        Couldn't load opportunity data.
      </div>
    );
  }

  const topCategory = stats.categoryBreakdown[0];

  return (
    <div className="glass-card col-span-1 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 lg:col-span-2">
      <h3 className="text-base font-semibold text-white">Opportunity Overview</h3>
      <p className="text-xs text-slate-500">Based on {stats.totalCases} researched case{stats.totalCases === 1 ? "" : "s"}</p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-slate-500">Average Opportunity Score</p>
          <p className="text-lg font-semibold text-white">{stats.avgOpportunityScore}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Highest Score</p>
          <p className="text-lg font-semibold text-white">{stats.highestScore}</p>
          <p className="truncate text-[11px] text-slate-500">{stats.highestScoreCase ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Lowest Score</p>
          <p className="text-lg font-semibold text-white">{stats.lowestScore}</p>
          <p className="truncate text-[11px] text-slate-500">{stats.lowestScoreCase ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Top Category</p>
          <p className="text-lg font-semibold text-white">{topCategory?.category ?? "—"}</p>
          <p className="text-[11px] text-slate-500">{topCategory ? `${topCategory.count} case${topCategory.count === 1 ? "" : "s"}` : ""}</p>
        </div>
      </div>

      {stats.categoryBreakdown.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-slate-800/60 pt-4">
          {stats.categoryBreakdown.slice(0, 5).map((c) => (
            <div key={c.category} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 truncate text-slate-400">{c.category}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(c.count / stats.totalCases) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-slate-300">{c.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}