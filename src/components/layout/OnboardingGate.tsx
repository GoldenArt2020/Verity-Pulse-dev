"use client";

import { useChannelId } from "@/hooks/useChannelId";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { channels, loaded } = useChannelId();

  if (!loaded) return null;

  if (channels.length === 0) {
    return <ChannelOnboarding />;
  }

  return <>{children}</>;
}