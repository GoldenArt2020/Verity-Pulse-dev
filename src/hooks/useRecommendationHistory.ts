// src/hooks/useRecommendationHistory.ts
"use client";

import { useState } from "react";
import { useChannelId } from "@/hooks/useChannelId";
import type { Recommendation } from "@/services/recommendations";

interface HistoryEntry {
  id: string;
  recommendations: Recommendation[];
  generated_at: string;
  expires_at: string;
}

export function useRecommendationHistory() {
  const { channelId } = useChannelId();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    if (!channelId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommendations/history?youtubeChannelId=${encodeURIComponent(channelId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load history");
      setHistory(data);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  return { history, loading, loaded, error, loadHistory };
}