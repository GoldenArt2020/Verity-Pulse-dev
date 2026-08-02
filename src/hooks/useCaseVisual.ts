"use client";

import { useEffect, useState } from "react";

interface CaseVisualState {
  url: string | null;
  type: "image" | "video" | null;
  posterUrl?: string;
  loading: boolean;
}

export function useCaseVisual(caseId: string, category: string, allowVideo: boolean) {
  const [state, setState] = useState<CaseVisualState>({ url: null, type: null, loading: true });

  useEffect(() => {
    if (!caseId) {
      setState({ url: null, type: null, loading: false });
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true }));

    const params = new URLSearchParams({ category, allowVideo: String(allowVideo) });

    fetch(`/api/cases/${caseId}/visual?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) {
          setState({
            url: data?.url ?? null,
            type: data?.type ?? null,
            posterUrl: data?.posterUrl,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (active) setState({ url: null, type: null, loading: false });
      });

    return () => {
      active = false;
    };
  }, [caseId, category, allowVideo]);

  return state;
}