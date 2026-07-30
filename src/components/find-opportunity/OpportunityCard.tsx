"use client";

import Link from "next/link";
import { Bookmark, ArrowUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface OpportunityCardProps {
  id?: string;
  score: number;
  scoreLabel: string;
  scoreColor: string;
  title: string;
  location: string;
  category: string;
  description: string;
  competitionScore: number | string;
}

function scoreLabel(score: number) {
  return score >= 90 ? "Excellent" : score >= 80 ? "Very Good" : score >= 60 ? "Good" : "Fair";
}

function scoreStyle(score: number) {
  return score >= 90
    ? "bg-emerald-500/90 text-white"
    : score >= 80
    ? "bg-emerald-500/80 text-white"
    : score >= 60
    ? "bg-amber-500/90 text-white"
    : "bg-rose-500/90 text-white";
}

const fakeTrend = Array.from({ length: 10 }, (_, i) => ({ v: 10 + i * 5 + Math.random() * 4 }));

export function OpportunityCard({ id, score, title, location, category, description, competitionScore }: OpportunityCardProps) {
  return (
    <Link
      href={`/case-analyzer/${id}`}
      className="glass-card grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-500/30"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800">
        <span className={`absolute left-1.5 top-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${scoreStyle(score)}`}>
          {score}
        </span>
      </div>

      <div className="min-w-0">
        <h4 className="truncate text-[15px] font-semibold text-white">{title}</h4>
        <p className="mt-0.5 text-xs text-slate-500">{location} · {category}</p>
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{description}</p>
      </div>

      <div className="w-24 text-center">
        <p className="text-[11px] text-slate-500">Opportunity Score</p>
        <div className="relative mx-auto mt-1 h-12 w-16">
          <svg viewBox="0 0 100 60" className="h-full w-full">
            <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 126} 126`}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
            <span className="text-lg font-bold text-white">{score}</span>
          </div>
        </div>
        <p className="text-[11px] font-medium text-emerald-400">{scoreLabel(score)}</p>
      </div>

      <div className="w-28 text-center">
        <p className="text-[11px] text-slate-500">Search Trend</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-emerald-400">
          <ArrowUp className="h-3 w-3" /> —
        </p>
        <div className="h-8 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fakeTrend}>
              <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-32 text-center">
        <p className="text-[11px] text-slate-500">Competition Score</p>
        <p className="text-sm font-semibold text-white">
          {competitionScore} <span className="text-[11px] font-normal text-slate-500">/100</span>
        </p>
      </div>

      <button className="self-start text-slate-500 hover:text-blue-400" aria-label="Save opportunity" onClick={(e) => e.preventDefault()}>
        <Bookmark className="h-4 w-4" />
      </button>
    </Link>
  );
}