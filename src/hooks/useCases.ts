"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/dataClient";
import type { Schema } from "../../amplify/data/resource";

type CaseType = Schema["Case"]["type"];

export function useCases() {
  const [cases, setCases] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    client.models.Case.list()
      .then(({ data, errors }) => {
        if (!active) return;
        if (errors) {
          setError(errors[0]?.message ?? "Failed to load cases.");
        } else {
          setCases(data);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load cases.");
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