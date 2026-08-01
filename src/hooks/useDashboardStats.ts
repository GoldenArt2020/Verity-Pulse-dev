"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCases: number;
  highOpportunityCases: number;
  avgOpportunityScore: number;
}

const MOCK_STATS: DashboardStats = {
  totalCases: 47,
  highOpportunityCases: 12,
  avgOpportunityScore: 68,
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const supabase = createClient();

    supabase
      .from("cases")
      .select("opportunity_score")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Supabase not ready yet, using mock stats:", error.message);
          setStats(MOCK_STATS);
          return;
        }
        const scores = (data ?? []).map((c) => c.opportunity_score ?? 0);
        const total = scores.length;
        const high = scores.filter((s) => s >= 80).length;
        const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
        setStats({ totalCases: total, highOpportunityCases: high, avgOpportunityScore: avg });
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Supabase unreachable, using mock stats:", err instanceof Error ? err.message : err);
        setStats(MOCK_STATS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, error };
}