"use client";

import { Target, Star, TrendingUp } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { OpportunityOverview } from "@/components/dashboard/OpportunityOverview";
import { OpportunityGauge } from "@/components/dashboard/OpportunityGauge";
import { TrendingOpportunities } from "@/components/dashboard/TrendingOpportunities";
import { RecentCases } from "@/components/dashboard/RecentCases";
import { RecentResearch } from "@/components/dashboard/RecentResearch";
import { IntelligenceFeedStrip } from "@/components/dashboard/IntelligenceFeedStrip";
import { STATS } from "@/constants/dashboardStats";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();

  const realStats = [
    { icon: Target, iconColor: "bg-blue-500/15 text-blue-400", label: "Total Opportunities", value: String(stats?.totalCases ?? 0), change: "—", period: "live", sparkline: STATS[0].sparkline },
    { icon: Star, iconColor: "bg-emerald-500/15 text-emerald-400", label: "High Opportunity Cases", value: String(stats?.highOpportunityCases ?? 0), change: "—", period: "live", sparkline: STATS[1].sparkline },
    { icon: TrendingUp, iconColor: "bg-blue-500/15 text-blue-400", label: "Avg. Opportunity Score", value: String(stats?.avgOpportunityScore ?? 0), change: "—", period: "live", sparkline: STATS[2].sparkline },
  ];

  return (
    <div>
      <TopBar
        title="Mission Control"
        subtitle="Your intelligence dashboard. Track opportunities, performance and uncover the stories others miss."
        icon={<Target className="h-4.5 w-4.5" />}
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-6 gap-4">
          {realStats.map((s) => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
          {STATS.slice(3).map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <OpportunityOverview />
          <OpportunityGauge />
          <TrendingOpportunities />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <RecentCases />
          <RecentResearch />
        </div>

        <IntelligenceFeedStrip />
      </div>
    </div>
  );
}