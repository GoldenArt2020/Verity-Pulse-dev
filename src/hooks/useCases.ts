"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyChannelIds } from "@/lib/myChannelIds";

interface CaseRow {
  id: string;
  name: string;
  country: string | null;
  category: string | null;
  opportunity_score: number | null;
  competition_score: number | null;
  summary: string | null;
  created_at: string | null;
}

export function useCases() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const channelIds = await getMyChannelIds();
        if (!active) return;
        if (channelIds.length === 0) {
          setCases([]);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase.from("cases").select("*").in("channel_id", channelIds);

        if (!active) return;
        if (error) setError(error.message);
        else setCases(data ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load cases.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { cases, loading, error };
}