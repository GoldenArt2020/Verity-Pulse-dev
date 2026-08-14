"use client";

import { Tv } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ChannelInput } from "@/components/channel-intelligence/ChannelInput";
import { AnalyticsConnectCard } from "@/components/case-intelligence/AnalyticsConnectCard";

export default function ChannelIntelligencePage() {
  return (
    <div>
      <TopBar
        title="Channel Intelligence"
        subtitle="Discover your channel's content DNA and what your audience actually rewards."
        icon={<Tv className="h-4.5 w-4.5" />}
      />

      <div className="space-y-4 p-6">
        <ChannelInput />
        <AnalyticsConnectCard />
        {/* rest of your existing Channel Intelligence components go here */}
      </div>
    </div>
  );
}