"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChannelId } from "@/hooks/useChannelId";
import type { ChannelDNA } from "@/services/creatorDNA";

interface UseChannelDNAResult {
  dna: ChannelDNA | null;
  loading: boolean;
  error: string | null;
}

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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("channels")
          .select("channel_dna")
          .eq("youtube_channel_id", channelId)
          .maybeSingle();

        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setDna((data?.channel_dna as unknown as ChannelDNA) ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load Creator DNA");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [channelId]);

  return { dna, loading, error };
}