"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Missing Persons",
  "Institutional Failures",
  "Organized Crime",
  "Police Corruption",
  "Cold Cases",
];

export function useCategoryCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const results = await Promise.all(
        CATEGORIES.map(async (cat) => {
          const { count } = await supabase
            .from("cases")
            .select("*", { count: "exact", head: true })
            .eq("category", cat);
          return [cat, count ?? 0] as const;
        })
      );
      if (!active) return;
      setCounts(Object.fromEntries(results));
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { counts, loading };
}