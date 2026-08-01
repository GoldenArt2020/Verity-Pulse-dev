"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CaseRow {
  id: string;
  name: string;
  country: string | null;
  category: string | null;
  opportunity_score: number | null;
  competition_score: number | null;
  summary: string | null;
}

export function useCases() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const supabase = createClient();

    supabase
      .from("cases")
      .select("*")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setCases(data ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { cases, loading, error };
}