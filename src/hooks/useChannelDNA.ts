"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/dataClient";
import { useChannelId } from "@/hooks/useChannelId";
import type { ChannelDNA } from "@/services/creatorDNA";

interface UseChannelDNAResult {
  dna: ChannelDNA | null;
  loading: boolean;
  error: string | null;
}

/**
 * Reads the cached Creator DNA for the currently connected channel
 * (Channel.channelDNA in DynamoDB). Does NOT call Groq or YouTube —
 * that only happens during onboarding via getOrBuildChannelDNA.
 */
export function useChannelDNA(): UseChannelDNAResult {
  const { channelId } = useChannelId();
  const [dna, setDna] = useState<ChannelDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!channelId) {
      setDna(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    client.models.Channel.list({
      filter: { youtubeChannelId: { eq: channelId } },
    })
      .then((res) => {
        if (!active) return;
        const channel = res.data?.[0];
        setDna((channel?.channelDNA as unknown as ChannelDNA) ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load Creator DNA");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [channelId]);

  return { dna, loading, error };
}