"use client";

import Link from "next/link";
import { Bookmark, TrendingUp } from "lucide-react";

interface OpportunityCardProps {
  id?: string;
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

export function OpportunityCard({ id, score, title, location, category, description, competitionScore }: OpportunityCardProps) {
  return (
    <Link
      href={`/case-analyzer/${id ?? ""}`}
      className="group block rounded-[18px] border border-white/[0.06] bg-[#111114] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.02]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-[#FAFAFA]">{title}</h3>
          <p className="mt-1 text-sm text-[#A1A1AA]">{location} · {category}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white"
          style={{ backgroundColor: scoreColor(score) }}
        >
          {score}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">{description}</p>

      <div className="mt-6 flex items-center gap-8 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-xs text-[#71717A]">Opportunity Score</p>
          <p className="mt-0.5 text-sm font-semibold text-[#FAFAFA]">{score}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#71717A]">Competition</p>
          <p className="mt-0.5 text-sm font-semibold text-[#FAFAFA]">{competitionScore}/100</p>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Rising</span>
        </div>
        <button
          className="ml-auto text-[#71717A] transition-colors hover:text-blue-400"
          aria-label="Save opportunity"
          onClick={(e) => e.preventDefault()}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </Link>
  );
}