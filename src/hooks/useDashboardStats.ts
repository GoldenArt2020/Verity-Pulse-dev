"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCases: number;
  highOpportunityCases: number;
  mediumOpportunityCases: number;
  lowOpportunityCases: number;
  avgOpportunityScore: number;
  highestScore: number;
  highestScoreCase: string | null;
  lowestScore: number;
  lowestScoreCase: string | null;
  categoryBreakdown: { category: string; count: number }[];
  totalCasesSparkline: { v: number }[];
  highOpportunitySparkline: { v: number }[];
  avgScoreSparkline: { v: number }[];
}

const SPARKLINE_DAYS = 7;

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: dbError } = await supabase
          .from("cases")
          .select("name, category, opportunity_score, created_at");

        if (!active) return;
        if (dbError) {
          setError(dbError.message);
          setStats(null);
          return;
        }

        const rows = data ?? [];
        const scored = rows.filter((c) => (c.opportunity_score ?? 0) > 0);
        const scores = scored.map((c) => c.opportunity_score as number);

        const total = scored.length;
        const high = scores.filter((s) => s >= 80).length;
        const medium = scores.filter((s) => s >= 50 && s < 80).length;
        const low = scores.filter((s) => s < 50).length;
        const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;

        let highest = { score: 0, name: null as string | null };
        let lowest = { score: 101, name: null as string | null };
        for (const c of scored) {
          const s = c.opportunity_score as number;
          if (s > highest.score) highest = { score: s, name: c.name };
          if (s < lowest.score) lowest = { score: s, name: c.name };
        }

        const categoryCounts: Record<string, number> = {};
        for (const c of scored) {
          const cat = c.category ?? "Uncategorized";
          categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
        }
        const categoryBreakdown = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        // Build last-N-day buckets (cumulative) for sparklines
        const dayKeys: string[] = [];
        const today = new Date();
        for (let i = SPARKLINE_DAYS - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dayKeys.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
        }

        const withDates = scored
          .filter((c) => !!c.created_at)
          .map((c) => ({
            day: (c.created_at as string).slice(0, 10),
            score: c.opportunity_score as number,
          }));

        const totalCasesSparkline: { v: number }[] = [];
        const highOpportunitySparkline: { v: number }[] = [];
        const avgScoreSparkline: { v: number }[] = [];

        for (const day of dayKeys) {
          const upToDay = withDates.filter((c) => c.day <= day);
          const cumulativeTotal = upToDay.length;
          const cumulativeHigh = upToDay.filter((c) => c.score >= 80).length;
          const cumulativeAvg =
            cumulativeTotal > 0
              ? Math.round(upToDay.reduce((a, c) => a + c.score, 0) / cumulativeTotal)
              : 0;

          totalCasesSparkline.push({ v: cumulativeTotal });
          highOpportunitySparkline.push({ v: cumulativeHigh });
          avgScoreSparkline.push({ v: cumulativeAvg });
        }

        setStats({
          totalCases: total,
          highOpportunityCases: high,
          mediumOpportunityCases: medium,
          lowOpportunityCases: low,
          avgOpportunityScore: avg,
          highestScore: total > 0 ? highest.score : 0,
          highestScoreCase: highest.name,
          lowestScore: total > 0 ? lowest.score : 0,
          lowestScoreCase: lowest.name,
          categoryBreakdown,
          totalCasesSparkline,
          highOpportunitySparkline,
          avgScoreSparkline,
        });
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load stats");
          setStats(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, error };
}