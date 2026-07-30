"use client";

import { CheckCircle2 } from "lucide-react";
import { OpportunityRadar } from "./OpportunityRadar";
import { ScoreBreakdownList } from "./ScoreBreakdownList";

export function ScoreBreakdownCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Opportunity Score Breakdown</h3>
      <p className="text-xs text-slate-500">Why this case has high potential</p>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <OpportunityRadar />
        <ScoreBreakdownList />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-xs text-slate-300">
          This case has an <span className="font-semibold text-emerald-400">Excellent</span> opportunity
          score. Strong demand, weak competition, and multiple untapped angles.
        </p>
      </div>
    </div>
  );
}