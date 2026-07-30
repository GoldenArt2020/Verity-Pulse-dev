"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/dataClient";
import type { Schema } from "../../amplify/data/resource";

type CaseType = Schema["Case"]["type"];

export function useCase(caseId: string) {
  const [caseData, setCaseData] = useState<CaseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    let active = true;
    setLoading(true);

    client.models.Case.get({ id: caseId })
      .then(({ data, errors }) => {
        if (!active) return;
        if (errors) {
          setError(errors[0]?.message ?? "Failed to load case.");
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