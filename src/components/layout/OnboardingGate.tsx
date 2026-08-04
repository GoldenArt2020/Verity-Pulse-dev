"use client";

import { useChannelId } from "@/hooks/useChannelId";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { channelId, loaded } = useChannelId();

  // Avoid flashing the onboarding screen while we're still reading localStorage.
  if (!loaded) return null;

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  return <>{children}</>;
}