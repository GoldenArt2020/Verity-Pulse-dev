"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CaseRow {
  id: string;
  name: string;
  country: string | null;
  category: string | null;
  tags: string[] | null;
  status: string;
  summary: string | null;
  opportunity_score: number | null;
  competition_score: number | null;
  coverage_score: number | null;
  coverage_intelligence: Record<string, unknown> | null;
  last_updated: string | null;
}

export function useCase(caseId: string) {
  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setCaseData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { caseData, loading, error, refetch: load };
}