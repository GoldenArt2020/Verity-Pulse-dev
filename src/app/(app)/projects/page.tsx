"use client";

import { ProjectsTopBarActions } from "@/components/projects/ProjectsTopBarActions";
import { ProjectStatCard } from "@/components/projects/ProjectStatCard";
import { ProjectsTabsBar } from "@/components/projects/ProjectsTabsBar";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsOverviewDonut } from "@/components/projects/ProjectsOverviewDonut";
import { ProgressOverviewChart } from "@/components/projects/ProgressOverviewChart";
import { AIProjectInsightsCard } from "@/components/projects/AIProjectInsightsCard";
import { RecentActivityCard } from "@/components/projects/RecentActivityCard";
import { PROJECT_STATS } from "@/constants/projects";

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <div>
          <h1 className="font-display text-lg font-bold text-white">Projects</h1>
          <p className="text-xs text-slate-500">
            Organize complex investigations and content series into structured projects.
          </p>
        </div>
        <ProjectsTopBarActions />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {PROJECT_STATS.map((s) => (
              <ProjectStatCard
                key={s.key}
                icon={s.icon as any}
                label={s.label}
                value={s.value}
                delta={s.delta}
                deltaUp={s.deltaUp}
                color={s.color}
              />
            ))}
          </div>

          <ProjectsTabsBar />

          <ProjectsTable />
        </div>

        <div className="space-y-4">
          <ProjectsOverviewDonut />
          <ProgressOverviewChart />
          <AIProjectInsightsCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}