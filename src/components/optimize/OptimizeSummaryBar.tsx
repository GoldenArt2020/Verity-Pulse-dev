"use client";

import { Eye, TrendingUp, Clock, Sparkles } from "lucide-react";

export function OptimizeSummaryBar() {
  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.92)} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">92</span>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Overall SEO Score</p>
          <p className="text-sm font-semibold text-emerald-400">Excellent</p>
          <p className="text-[10px] text-slate-500">Top 7% of similar videos</p>
        </div>
      </div>

      <SummaryStat icon={Eye} label="Predicted Views (30 Days)" value="85K – 125K" sub="Very High Potential" subColor="text-emerald-400" />
      <SummaryStat icon={TrendingUp} label="Engagement Rate (Predicted)" value="6.8%" sub="Very Good" subColor="text-emerald-400" />
      <SummaryStat icon={Clock} label="Recommended Publish Time" value="Saturday 6:00 PM" sub="Your audience is most active" subColor="text-slate-500" cta="View Best Times" />

      <div className="flex flex-col gap-2">
        <button className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98]">
          <Sparkles className="h-3.5 w-3.5" /> Finalize & Add to Content Planner
        </button>
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
          Save as Draft
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, sub, subColor, cta }: { icon: typeof Eye; label: string; value: string; sub: string; subColor: string; cta?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
        <p className={`text-[10px] ${subColor}`}>
          {sub} {cta && <span className="ml-1 text-blue-400">{cta}</span>}
        </p>
      </div>
    </div>
  );
}