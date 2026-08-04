"use client";

import { useMemo } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCases } from "@/hooks/useCases";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function useRecommendationConversion() {
  const { recommendations, loading: recsLoading } = useRecommendations();
  const { cases, loading: casesLoading } = useCases();

  const result = useMemo(() => {
    if (recommendations.length === 0) {
      return { suggested: 0, researched: 0, pct: 0, items: [] as { title: string; researched: boolean }[] };
    }

    const caseIds = new Set(cases.map((c) => c.id));
    const items = recommendations.map((r) => ({
      title: r.title,
      researched: caseIds.has(slugify(r.title)),
    }));
    const researched = items.filter((i) => i.researched).length;

    return {
      suggested: recommendations.length,
      researched,
      pct: Math.round((researched / recommendations.length) * 100),
      items,
    };
  }, [recommendations, cases]);

  return { ...result, loading: recsLoading || casesLoading };
}