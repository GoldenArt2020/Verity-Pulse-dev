"use client";

import { ArrowUp } from "lucide-react";
import { OPPORTUNITY_STATS } from "@/constants/contentPlannerWorkflow";

function OpportunityGauge({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono-vp text-xl font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 text-center">
      <span className="text-[11px] text-slate-500">{label}</span>
      {children}
    </div>
  );
}

export function OpportunityStatPanels() {
  const { opportunityScore, searchTrend, youtubeCoverage, competitionScore } = OPPORTUNITY_STATS;

  return (
    <div className="flex items-center divide-x divide-slate-800/60">
      <Panel label="Opportunity Score">
        <OpportunityGauge value={opportunityScore.value} />
        <span className="text-[11px] font-medium text-emerald-400">{opportunityScore.label}</span>
        <span className="text-[10px] text-slate-500">{opportunityScore.sub}</span>
      </Panel>

      <Panel label="Search Trend (30D)">
        <span className="mt-2 flex items-center gap-1 text-xl font-bold text-emerald-400">
          <ArrowUp className="h-4 w-4" />
          {searchTrend.value}
        </span>
        <span className="text-[10px] text-slate-500">{searchTrend.sub}</span>
      </Panel>

      <Panel label="YouTube Coverage">
        <span className="mt-2 text-xl font-bold text-emerald-400">{youtubeCoverage.level}</span>
        <span className="text-[11px] text-slate-400">{youtubeCoverage.score}</span>
        <span className="text-[10px] text-slate-500">{youtubeCoverage.sub}</span>
      </Panel>

      <Panel label="Competition Score">
        <span className="mt-2 text-xl font-bold text-white">
          {competitionScore.value} <span className="text-xs text-slate-500">/{competitionScore.max}</span>
        </span>
        <span className="text-[11px] font-medium text-emerald-400">{competitionScore.level}</span>
      </Panel>
    </div>
  );
}