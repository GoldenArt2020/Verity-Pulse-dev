"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyChannelIds } from "@/lib/myChannelIds";

export interface CategoryCount {
  label: string;
  count: number;
}

export function useCategoryCounts() {
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const channelIds = await getMyChannelIds();
      if (!active) return;
      if (channelIds.length === 0) {
        setCategories([]);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.from("cases").select("category").in("channel_id", channelIds);
      if (!active) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      const counts = new Map<string, number>();
      for (const row of data) {
        const label = row.category?.trim();
        if (!label) continue; // skip nulls
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      const sorted = Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
      setCategories(sorted);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}