"use client";

import { Suspense } from "react";
import { Tv } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ChannelInput } from "@/components/channel-intelligence/ChannelInput";
import { ConnectRealChannelCard } from "@/components/channel-intelligence/ConnectRealChannelCard";
import { AnalyticsConnectCard } from "@/components/case-intelligence/AnalyticsConnectCard";
import { ChannelRegionSetting } from "@/components/channel-intelligence/ChannelRegionSetting";

export default function ChannelIntelligencePage() {
  return (
    <div>
      <TopBar
        title="Channel Intelligence"
        subtitle="Discover your channel's content DNA and what your audience actually rewards."
        icon={<Tv className="h-4.5 w-4.5" />}
      />

      <div className="space-y-4 p-6">
        {/* Both cards read ?connect= / ?analytics= / ?reason= via useSearchParams,
            which needs a Suspense boundary above it to avoid bailing out of
            static prerendering at build time. */}
        <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-slate-900/40" />}>
          <ConnectRealChannelCard />
          <AnalyticsConnectCard />
        </Suspense>

        <ChannelInput />
        <ChannelRegionSetting />
        {/* rest of your existing Channel Intelligence components go here */}
      </div>
    </div>
  );
}