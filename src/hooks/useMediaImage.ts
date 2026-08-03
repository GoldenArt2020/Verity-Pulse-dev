"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, string | null>();

export function useMediaImage(query: string) {
  const [url, setUrl] = useState<string | null>(cache.get(query) ?? null);
  const [loading, setLoading] = useState(!cache.has(query));

  useEffect(() => {
    if (cache.has(query)) {
      setUrl(cache.get(query) ?? null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/media/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        cache.set(query, data.url ?? null);
        setUrl(data.url ?? null);
      })
      .catch(() => active && setUrl(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  return { url, loading };
}