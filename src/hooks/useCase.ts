"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CaseRow {
  id: string;
  name: string;
  country: string | null;
  category: string | null;
  status: string;
  summary: string | null;
  opportunity_score: number | null;
  competition_score: number | null;
  coverage_score: number | null;
  last_updated: string | null;
}

export function useCase(caseId: string) {
  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    let active = true;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setCaseData(data);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load case.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [caseId]);

  return { caseData, loading, error };
}