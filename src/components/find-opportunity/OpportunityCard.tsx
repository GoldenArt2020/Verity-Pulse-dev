"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";

interface OpportunityCardProps {
  id?: string;
  rank?: number;
  score: number;
  title: string;
  location: string;
  category: string;
  description: string;
  competitionScore: number | string;
}

function scoreColor(score: number) {
  return score >= 90 ? "#10B981" : score >= 80 ? "#34D399" : score >= 60 ? "#F59E0B" : "#F43F5E";
}

export function OpportunityCard({
  id,
  rank,
  score,
  title,
  location,
  category,
  description,
  competitionScore,
}: OpportunityCardProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);
  const competitionLabel =
    Number(competitionScore) <= 30 ? "Low" : Number(competitionScore) <= 60 ? "Medium" : "High";

  async function handleOpen() {
    if (!id || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open case");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Failed to open case");
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
      className="group relative block w-[280px] sm:w-[320px] shrink-0 cursor-pointer overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111114] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
    >
      {rank !== undefined && (
        <span className="absolute left-4 top-4 z-10 rounded-md bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
          #{rank}
        </span>
      )}

      <button
        className="absolute right-4 top-4 z-10 text-[#71717A] transition-colors hover:text-blue-400"
        aria-label="Save opportunity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Bookmark className="h-4 w-4" />
      </button>

      <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-[#FAFAFA]">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-[#71717A]">
            {location} · {category}
          </p>
        </div>
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <svg viewBox="0 0 64 64" className="h-11 w-11 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute text-xs font-bold text-[#FAFAFA]">{score}</span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA]">{description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
        <div>
          <p className="text-[#71717A]">Competition</p>
          <p className="mt-0.5 font-semibold text-[#FAFAFA]">{competitionLabel}</p>
        </div>
        <div>
          <p className="text-[#71717A]">Search Trend</p>
          <p className="mt-0.5 font-semibold text-emerald-400">Rising</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-rose-400">{error}</p>
      )}

      {saving && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[18px] bg-black/60 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      )}
    </div>
  );
}