"use client";

import { TeamTopBarActions } from "@/components/team/TeamTopBarActions";
import { TeamStatCard } from "@/components/team/TeamStatCard";
import { TeamTabsBar } from "@/components/team/TeamTabsBar";
import { MembersTable } from "@/components/team/MembersTable";
import { InviteMembersCard } from "@/components/team/InviteMembersCard";
import { TeamActivityFeed } from "@/components/team/TeamActivityFeed";
import { WorkloadDistributionCard } from "@/components/team/WorkloadDistributionCard";
import { TeamProductivityChart } from "@/components/team/TeamProductivityChart";
import { TopPerformersCard } from "@/components/team/TopPerformersCard";
import { AITeamInsightsCard } from "@/components/team/AITeamInsightsCard";
import { TEAM_STATS } from "@/constants/team";

export default function TeamPage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <div>
          <h1 className="font-display text-lg font-bold text-white">Team Management</h1>
          <p className="text-xs text-slate-500">
            Manage your team, roles, permissions, and collaboration.
          </p>
        </div>
        <TeamTopBarActions />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {TEAM_STATS.map((s) => (
              <TeamStatCard
                key={s.key}
                icon={s.icon as any}
                label={s.label}
                value={s.value}
                sub={s.sub}
                subUp={s.subUp}
                color={s.color}
                dot={s.dot}
              />
            ))}
          </div>

          <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40">
            <TeamTabsBar />
            <div className="p-4">
              <MembersTable />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <WorkloadDistributionCard />
            <TeamProductivityChart />
            <TopPerformersCard />
          </div>
        </div>

        <div className="space-y-4">
          <InviteMembersCard />
          <TeamActivityFeed />
        </div>
      </div>
    </div>
  );
}