// src/components/angle-builder/AudienceProfileMatch.tsx
"use client";

import { Users } from "lucide-react";
import { useChannelDNA } from "@/hooks/useChannelDNA";
import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

const LENS_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

function ratingLabel(pct: number) {
  if (pct >= 85) return { label: "Excellent Match", color: "text-emerald-400" };
  if (pct >= 65) return { label: "Strong Match", color: "text-blue-400" };
  if (pct >= 40) return { label: "Moderate Match", color: "text-amber-400" };
  return { label: "Weak Match", color: "text-rose-400" };
}

export function AudienceProfileMatch({ angle }: { angle: GeneratedAngle | null }) {
  const { dna, loading } = useChannelDNA();

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />;
  }

  if (!angle) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-base font-semibold text-white">Audience Profile Match</h3>
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <Users className="h-5 w-5 text-slate-600" />
          <p className="text-xs text-slate-500">Select an angle to see how it matches your audience.</p>
        </div>
      </div>
    );
  }

  const pct = Math.round((angle.scores.audienceMatch / 15) * 100);
  const rating = ratingLabel(pct);
  const lensPerf = dna?.lensPerformance.find((p) => p.lens === angle.lens);

  const traits: string[] = [];
  if (lensPerf && lensPerf.videoCount > 0) {
    traits.push(`Your ${LENS_LABELS[angle.lens] ?? angle.lens} videos perform ${lensPerf.avgViewsRelativeToChannel} (${lensPerf.videoCount} past video${lensPerf.videoCount === 1 ? "" : "s"})`);
  }
  if (dna?.channelStyle?.preferredSubjects?.length) {
    traits.push(`Preferred subject match: ${dna.channelStyle.preferredSubjects.slice(0, 2).join(", ")}`);
  }
  if (dna?.channelStyle?.emotionalTone) {
    traits.push(`Emotional tone fit: ${dna.channelStyle.emotionalTone}`);
  }
  if (dna?.strengths?.length) {
    traits.push(...dna.strengths.slice(0, 2));
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Audience Profile Match</h3>

      <div className="mt-4 flex gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="3"
              strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - pct / 100)} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{pct}%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium ${rating.color}`}>{rating.label}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {dna ? "Based on your Creator DNA" : "Connect your channel for audience-specific signals"}
          </p>
          {traits.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {traits.map((t) => (
                <p key={t} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <span className="mt-0.5 text-emerald-400">✓</span> {t}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}