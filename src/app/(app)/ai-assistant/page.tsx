"use client";

import { AIAssistantTopBar } from "@/components/ai-assistant/AIAssistantTopBar";
import { GreetingCard } from "@/components/ai-assistant/GreetingCard";
import { AICopilotChat } from "@/components/ai-assistant/AICopilotChat";
import { RecentConversationsCard } from "@/components/ai-assistant/RecentConversationsCard";
import { AIInsightsCard } from "@/components/ai-assistant/AIInsightsCard";
import { AIToolsCard } from "@/components/ai-assistant/AIToolsCard";
import { ActivityFeedCard } from "@/components/ai-assistant/ActivityFeedCard";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <AIAssistantTopBar />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <GreetingCard />
          <AICopilotChat />
          <RecentConversationsCard />
        </div>
        <div className="flex flex-col gap-6">
          <AIInsightsCard />
          <AIToolsCard />
          <ActivityFeedCard />
        </div>
      </div>
    </div>
  );
}