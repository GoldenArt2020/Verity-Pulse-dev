"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vp_channel_id";

export function useChannelId() {
  const [channelId, setChannelId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setChannelId(stored);
  }, []);

  function saveChannelId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setChannelId(id);
  }

  return { channelId, saveChannelId };
}