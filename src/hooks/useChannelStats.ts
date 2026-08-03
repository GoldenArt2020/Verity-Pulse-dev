"use client";

import { useCallback, useEffect, useState } from "react";

interface ChannelStats {
  channelId: string;
  title: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export function useChannelStats(channelId?: string) {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/youtube/channel-stats?channelId=${channelId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to fetch channel stats.");
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setStats(data);
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to fetch channel stats.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [channelId, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((n) => n + 1);
  }, []);

  return { stats, loading, error, refresh, lastSyncedAt };
}