"use client";

import { ProfileTopBar } from "@/components/profile/ProfileTopBar";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { AchievementsCard } from "@/components/profile/AchievementsCard";
import { SubscriptionCard } from "@/components/profile/SubscriptionCard";
import { AccountWorkspaceCard } from "@/components/profile/AccountWorkspaceCard";
import { RecentActivityProfileCard } from "@/components/profile/RecentActivityProfileCard";
import { APIKeysCard } from "@/components/profile/APIKeysCard";
import { SecurityStatusCard } from "@/components/profile/SecurityStatusCard";
import { ConnectedAccountsCard } from "@/components/profile/ConnectedAccountsCard";
import { ProductivityInsightsCard } from "@/components/profile/ProductivityInsightsCard";
import { RecentSessionsCard } from "@/components/profile/RecentSessionsCard";
import { UsageOverviewCard } from "@/components/profile/UsageOverviewCard";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <ProfileTopBar />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-1">
          <ProfileHeaderCard />
        </div>
        <div className="xl:col-span-2">
          <AchievementsCard />
        </div>
        <div className="xl:col-span-1">
          <SubscriptionCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <AccountWorkspaceCard />
        <RecentActivityProfileCard />
        <APIKeysCard />
        <SecurityStatusCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <ConnectedAccountsCard />
        <ProductivityInsightsCard />
        <RecentSessionsCard />
        <UsageOverviewCard />
      </div>
    </div>
  );
}