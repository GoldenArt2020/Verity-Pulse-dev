"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";

export function OpportunityGauge() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-900/40" />;
  if (error || !stats) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-sm text-slate-400">
        Couldn't load distribution.
      </div>
    );
  }

  const { totalCases, avgOpportunityScore, highOpportunityCases, mediumOpportunityCases, lowOpportunityCases } = stats;
  const angle = (avgOpportunityScore / 100) * 180;
  const pct = (n: number) => (totalCases > 0 ? Math.round((n / totalCases) * 100) : 0);

  const label =
    avgOpportunityScore >= 80 ? "Excellent Opportunity" :
    avgOpportunityScore >= 50 ? "Good Opportunity" :
    totalCases > 0 ? "Needs Improvement" : "No Data Yet";

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Opportunity Score Distribution</h3>

      <div className="relative mx-auto mt-4 h-[130px] w-[220px]">
        <svg viewBox="0 0 220 130" className="h-full w-full">
          <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 283} 283`}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <span className="font-mono-vp text-4xl font-bold text-white">{avgOpportunityScore}</span>
          <span className="text-xs text-emerald-400">{label}</span>
        </div>
      </div>

      <div className="mt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">80 - 100</span>
            <span className="text-slate-300">High Opportunity</span>
          </div>
          <span className="font-medium text-white">{pct(highOpportunityCases)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">50 - 79</span>
            <span className="text-slate-300">Medium Opportunity</span>
          </div>
          <span className="font-medium text-white">{pct(mediumOpportunityCases)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-slate-400">0 - 49</span>
            <span className="text-slate-300">Low Opportunity</span>
          </div>
          <span className="font-medium text-white">{pct(lowOpportunityCases)}%</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
        <span className="text-slate-500">Total Analyzed</span>
        <span className="font-semibold text-white">{totalCases}</span>
      </div>
    </div>
  );
}