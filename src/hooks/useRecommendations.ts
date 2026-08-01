"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChannelId } from "@/hooks/useChannelId";
import type { Recommendation } from "@/services/recommendations";

export function useRecommendations() {
  const { channelId } = useChannelId();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCached = useCallback(async () => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("channels")
      .select("recommendations, recommendations_generated_at")
      .eq("youtube_channel_id", channelId)
      .maybeSingle();

    if (error) {
      setError(error.message);
    } else {
      setRecommendations((data?.recommendations as unknown as Recommendation[]) ?? []);
      setGeneratedAt(data?.recommendations_generated_at ?? null);
    }
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    loadCached();
  }, [loadCached]);

  async function refresh() {
    if (!channelId) return;
    setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/channel/refresh-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeChannelId: channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to refresh recommendations");

      setRecommendations(data.recommendations);
      setGeneratedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  }

  return { recommendations, generatedAt, loading, refreshing, error, refresh };
}