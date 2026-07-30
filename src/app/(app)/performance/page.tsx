"use client";

import { BarChart3 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PerformanceTopBarActions } from "@/components/performance/PerformanceTopBarActions";
import { PerformanceStatCard } from "@/components/performance/PerformanceStatCard";
import { PerformanceTabs } from "@/components/performance/PerformanceTabs";
import { ViewsOverTimeChart } from "@/components/performance/ViewsOverTimeChart";
import { TrafficSourcesDonut } from "@/components/performance/TrafficSourcesDonut";
import { EngagementStrip } from "@/components/performance/EngagementStrip";
import { TopPerformingVideos } from "@/components/performance/TopPerformingVideos";
import { AIPerformanceInsights } from "@/components/performance/AIPerformanceInsights";
import { TopPerformingTopics } from "@/components/performance/TopPerformingTopics";
import { RecommendationsPanel } from "@/components/performance/RecommendationsPanel";
import { PERFORMANCE_STATS } from "@/constants/performanceStats";

export default function PerformancePage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <div>
          <h1 className="font-display text-lg font-bold text-white">Performance</h1>
          <p className="text-xs text-slate-500">Track how your true crime content performs and what drives growth.</p>
        </div>
        <PerformanceTopBarActions />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            {PERFORMANCE_STATS.map((s) => (
              <PerformanceStatCard key={s.label} {...s} />
            ))}
          </div>

          <PerformanceTabs />

          <div className="grid grid-cols-3 gap-4">
            <ViewsOverTimeChart />
            <TrafficSourcesDonut />
          </div>

          <EngagementStrip />

          <div className="grid grid-cols-4 gap-4">
            <TopPerformingVideos />
          </div>
        </div>

        <div className="space-y-4">
          <AIPerformanceInsights />
          <TopPerformingTopics />
          <RecommendationsPanel />
        </div>
      </div>
    </div>
  );
}