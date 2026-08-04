"use client";

import { useRecommendationConversion } from "@/hooks/useRecommendationConversion";

export function RecommendationConversionCard() {
  const { suggested, researched, pct, loading } = useRecommendationConversion();

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-900/40" />;
  }

  if (suggested === 0) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-base font-semibold text-white">Recommendation Follow-Through</h3>
        <p className="mt-3 text-xs text-slate-500">
          No recommendations generated yet. Visit Discover to get suggestions based on your channel.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Recommendation Follow-Through</h3>
      <p className="mt-1 text-xs text-slate-500">Estimated — matched by case title similarity</p>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{researched}</span>
        <span className="pb-1 text-sm text-slate-500">of {suggested} suggested</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{pct}% follow-through rate</p>
    </div>
  );
}