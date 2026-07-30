"use client";

import { BillingTopBar } from "@/components/billing/BillingTopBar";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { CurrentUsageCard } from "@/components/billing/CurrentUsageCard";
import { NextBillingCard } from "@/components/billing/NextBillingCard";
import { PlanComparisonCard } from "@/components/billing/PlanComparisonCard";
import { BillingHistoryCard } from "@/components/billing/BillingHistoryCard";
import { PaymentMethodCard } from "@/components/billing/PaymentMethodCard";
import { UsageAnalyticsCard } from "@/components/billing/UsageAnalyticsCard";
import { PaymentSecurityCard } from "@/components/billing/PaymentSecurityCard";
import { UsageTipsCard } from "@/components/billing/UsageTipsCard";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <BillingTopBar />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CurrentPlanCard />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <CurrentUsageCard />
        </div>
        <div className="hidden xl:block" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PlanComparisonCard />
        </div>
        <NextBillingCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BillingHistoryCard />
        <PaymentMethodCard />
        <div className="flex flex-col gap-6">
          <PaymentSecurityCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <UsageAnalyticsCard />
        </div>
        <UsageTipsCard />
      </div>
    </div>
  );
}