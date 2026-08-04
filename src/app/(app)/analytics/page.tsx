"use client";

import { Target, Star, TrendingUp } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChannelStatCards } from "@/components/dashboard/ChannelStatCards";
import { OpportunityOverview } from "@/components/dashboard/OpportunityOverview";
import { OpportunityGauge } from "@/components/dashboard/OpportunityGauge";
import { RecommendationConversionCard } from "@/components/dashboard/RecommendationConversionCard";
import { RecentCases } from "@/components/dashboard/RecentCases";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function AnalyticsPage() {
  const { stats, loading } = useDashboardStats();

  const caseStats = [
    {
      icon: Target,
      iconColor: "bg-blue-500/15 text-blue-400",
      label: "Total Cases Researched",
      value: String(stats?.totalCases ?? 0),
      change: "—",
      period: "live",
      sparkline: stats?.totalCasesSparkline ?? [],
    },
    {
      icon: Star,
      iconColor: "bg-emerald-500/15 text-emerald-400",
      label: "High Opportunity Cases",
      value: String(stats?.highOpportunityCases ?? 0),
      change: "—",
      period: "live",
      sparkline: stats?.highOpportunitySparkline ?? [],
    },
    {
      icon: TrendingUp,
      iconColor: "bg-blue-500/15 text-blue-400",
      label: "Avg. Opportunity Score",
      value: String(stats?.avgOpportunityScore ?? 0),
      change: "—",
      period: "live",
      sparkline: stats?.avgScoreSparkline ?? [],
    },
  ];

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle="Track opportunities, performance and uncover the stories others miss."
        icon={<Target className="h-4.5 w-4.5" />}
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-6 gap-4">
          {caseStats.map((s) => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
          <ChannelStatCards />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <OpportunityOverview />
          <OpportunityGauge />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <RecentCases />
          <RecommendationConversionCard />
        </div>
      </div>
    </div>
  );
}