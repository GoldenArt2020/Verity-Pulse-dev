"use client";

import { useMemo } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCases } from "@/hooks/useCases";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Approximate match: true if the recommendation's title and a researched
 * case's name share enough normalized words to plausibly be the same case.
 * This is fuzzy by necessity — there's no stored ID linking a Recommendation
 * to a CaseRow, only free-text titles generated independently by Groq at
 * different times. False negatives (a real match not detected) are more
 * likely than false positives here, so this number is a reasonable
 * lower-bound estimate, not an exact count.
 */
function isLikelyMatch(recTitle: string, caseName: string): boolean {
  const a = normalize(recTitle);
  const b = normalize(caseName);
  if (!a || !b) return false;
  if (a === b) return true;

  const wordsA = new Set(a.split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let overlap = 0;
  for (const w of wordsA) if (wordsB.has(w)) overlap++;

  const smaller = Math.min(wordsA.size, wordsB.size);
  return overlap / smaller >= 0.6;
}

export function useRecommendationConversion() {
  const { recommendations, loading: recsLoading } = useRecommendations();
  const { cases, loading: casesLoading } = useCases();

  const result = useMemo(() => {
    if (recommendations.length === 0) {
      return { suggested: 0, researched: 0, pct: 0, items: [] as { title: string; researched: boolean }[] };
    }

    const researchedCases = cases.filter((c) => (c.opportunity_score ?? 0) > 0 && c.summary);

    const items = recommendations.map((r) => ({
      title: r.title,
      researched: researchedCases.some((c) => isLikelyMatch(r.title, c.name)),
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