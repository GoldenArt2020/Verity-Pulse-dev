"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/dataClient";

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

    client.models.Case.list()
      .then(({ data, errors }) => {
        if (!active) return;
        if (errors) {
          console.warn("Amplify not ready yet, using mock stats:", errors[0]?.message);
          setStats(MOCK_STATS);
          return;
        }

        const scores = data.map((c) => c.opportunityScore ?? 0);
        const total = data.length;
        const high = scores.filter((s) => s >= 80).length;
        const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;

        setStats({ totalCases: total, highOpportunityCases: high, avgOpportunityScore: avg });
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Amplify unreachable, using mock stats:", err instanceof Error ? err.message : err);
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