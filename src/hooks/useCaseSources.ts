"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SourceRow {
  id: string;
  publisher: string;
  url: string;
  date: string | null;
  reliability: "HIGH" | "MEDIUM" | "LOW" | null;
  type: string | null;
}

export function useCaseSources(caseId: string) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sources")
          .select("*")
          .eq("case_id", caseId);

        if (!active) return;
        if (error) setError(error.message);
        else setSources(data ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load sources");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [caseId]);

  return { sources, loading, error };
}