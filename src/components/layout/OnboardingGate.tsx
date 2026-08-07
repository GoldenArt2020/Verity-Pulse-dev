"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useChannelId } from "@/hooks/useChannelId";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
<<<<<<< ours
  const { channels, loaded } = useChannelId();
=======
  const { channels, loaded, saveChannel } = useChannelId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledConnectedParam = useRef(false);

  // After the unified OAuth connect flow redirects back with
  // ?connected=<channelRowId>, make that the active channel (matters most
  // when a user already has other channels connected — otherwise the
  // newly connected one wouldn't automatically become the active one).
  useEffect(() => {
    const connectedId = searchParams.get("connected");
    if (connectedId && !handledConnectedParam.current) {
      handledConnectedParam.current = true;
      saveChannel(connectedId).then(() => {
        router.replace(pathname);
      });
    }
  }, [searchParams, saveChannel, router, pathname]);
>>>>>>> theirs

  if (!loaded) return null;

  if (channels.length === 0) {
    return <ChannelOnboarding />;
  }

  return <>{children}</>;
}