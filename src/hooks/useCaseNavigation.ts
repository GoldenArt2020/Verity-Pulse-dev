"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateCase } from "@/services/getOrCreateCase";

export function useCaseNavigation() {
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function goToCase(caseName: string) {
    setNavigatingTo(caseName);
    setError(null);
    try {
      const caseStub = await getOrCreateCase(caseName);
      router.push(`/case-analyzer/${caseStub.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open case");
      setNavigatingTo(null);
    }
  }

  return { goToCase, navigatingTo, error };
}