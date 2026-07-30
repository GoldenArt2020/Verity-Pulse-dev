"use client";

import { Search, TrendingDown, Users, GitBranch, DollarSign, Clock } from "lucide-react";

const ROWS = [
  { icon: Search, color: "text-blue-400", label: "Search Demand", desc: "Search interest is very high and rising fast.", score: 95, barColor: "bg-blue-500" },
  { icon: TrendingDown, color: "text-emerald-400", label: "Low Competition", desc: "Very few channels covering this case in-depth.", score: 92, barColor: "bg-emerald-500" },
  { icon: Users, color: "text-purple-400", label: "Audience Interest", desc: "High engagement on related content.", score: 90, barColor: "bg-purple-500" },
  { icon: GitBranch, color: "text-emerald-400", label: "Narrative Gaps", desc: "Multiple unexplored angles detected.", score: 88, barColor: "bg-amber-500" },
  { icon: DollarSign, color: "text-emerald-400", label: "Monetization Potential", desc: "Strong potential for RPM and retention.", score: 85, barColor: "bg-emerald-500" },
  { icon: Clock, color: "text-amber-400", label: "Timeliness", desc: "Recent police updates and public interest.", score: 70, barColor: "bg-amber-500" },
];

export function ScoreBreakdownList() {
  return (
    <div className="space-y-4">
      {ROWS.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Icon className={`h-3.5 w-3.5 ${r.color}`} />
                {r.label}
              </span>
              <span className="text-sm font-semibold text-white">{r.score}/100</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{r.desc}</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800">
              <div className={`h-1.5 rounded-full ${r.barColor}`} style={{ width: `${r.score}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}