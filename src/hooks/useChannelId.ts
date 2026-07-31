"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vp_channel_id";
const HANDLE_KEY = "vp_channel_handle";

export function useChannelId() {
  const [channelId, setChannelId] = useState<string | undefined>(undefined);
  const [channelHandle, setChannelHandle] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    const storedHandle = localStorage.getItem(HANDLE_KEY);
    if (storedId) setChannelId(storedId);
    if (storedHandle) setChannelHandle(storedHandle);
  }, []);

  function saveChannel(id: string, handle: string) {
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(HANDLE_KEY, handle);
    setChannelId(id);
    setChannelHandle(handle);
  }

  function clearChannel() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HANDLE_KEY);
    setChannelId(undefined);
    setChannelHandle(undefined);
  }

  return { channelId, channelHandle, saveChannel, clearChannel };
}