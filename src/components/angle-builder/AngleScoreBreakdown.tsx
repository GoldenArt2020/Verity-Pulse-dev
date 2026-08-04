// src/components/angle-builder/AngleScoreBreakdown.tsx
"use client";

import { Activity } from "lucide-react";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

const MAX = { searchDemand: 25, competition: 20, emotionalImpact: 25, originality: 15, audienceMatch: 15 };
const TOTAL_MAX = 100;

const SEGMENT_META = [
  { key: "searchDemand" as const, label: "Search Demand", dot: "bg-blue-400", stroke: "#3B82F6" },
  { key: "competition" as const, label: "Competition", dot: "bg-amber-400", stroke: "#F59E0B" },
  { key: "emotionalImpact" as const, label: "Emotional Impact", dot: "bg-purple-400", stroke: "#A855F7" },
  { key: "originality" as const, label: "Originality", dot: "bg-emerald-400", stroke: "#10B981" },
  { key: "audienceMatch" as const, label: "Audience Match", dot: "bg-blue-300", stroke: "#93C5FD" },
];

function ratingLabel(total: number) {
  if (total >= 85) return { label: "Excellent", color: "text-emerald-400" };
  if (total >= 70) return { label: "Strong", color: "text-blue-400" };
  if (total >= 50) return { label: "Moderate", color: "text-amber-400" };
  return { label: "Weak", color: "text-rose-400" };
}

export function AngleScoreBreakdown({ angle }: { angle: GeneratedAngle | null }) {
  if (!angle) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-base font-semibold text-white">Angle Score Breakdown</h3>
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <Activity className="h-5 w-5 text-slate-600" />
          <p className="text-xs text-slate-500">Select an angle to see its score breakdown.</p>
        </div>
      </div>
    );
  }

  const { scores } = angle;
  const total = scores.searchDemand + scores.competition + scores.emotionalImpact + scores.originality + scores.audienceMatch;
  const rating = ratingLabel(total);

  const circumference = 97.4;
  let cumulativeOffset = 0;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Angle Score Breakdown</h3>

      <div className="mt-4 flex gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="4" />
            {SEGMENT_META.map((seg) => {
              const value = scores[seg.key];
              const fraction = value / MAX[seg.key] / SEGMENT_META.length;
              const dash = fraction * circumference;
              const offset = circumference - cumulativeOffset;
              cumulativeOffset += dash;
              return (
                <circle
                  key={seg.key}
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={seg.stroke} strokeWidth="4"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{total}</span>
            <span className={`text-[9px] ${rating.color}`}>{rating.label}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {SEGMENT_META.map((seg) => (
            <div key={seg.key} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className={`h-2 w-2 rounded-full ${seg.dot}`} /> {seg.label}
              </span>
              <span className="font-medium text-white">
                {scores[seg.key]}/{MAX[seg.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}