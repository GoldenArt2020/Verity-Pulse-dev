"use client";

import { useEffect, useState } from "react";

interface Provider {
  name: string;
  category: string;
  status: "connected" | "degraded" | "disconnected";
  detail: string;
}

export function useProviderHealth() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/providers/health")
      .then((res) => res.json())
      .then((data) => {
        if (active) setProviders(data.providers);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { providers, loading };
}