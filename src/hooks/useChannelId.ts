"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface ConnectedChannel {
  id: string; // channels.id (uuid) — the row's primary key, not the YouTube ID
  youtubeChannelId: string;
  channelName: string;
}

export function useChannelId() {
  const { user, isLoading: authLoading } = useAuthUser();
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [activeChannelRowId, setActiveChannelRowId] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (authLoading) {
      // Auth hasn't resolved yet — don't decide "no channels" prematurely,
      // or the onboarding form flashes before real auth/channel data loads.
      return;
    }

    if (!user) {
      setChannels([]);
      setActiveChannelRowId(undefined);
      setLoaded(true);
      return;
    }

    const supabase = createClient();

    const [{ data: channelRows, error: channelsError }, { data: activeRow }] = await Promise.all([
      supabase
        .from("channels")
        .select("id, youtube_channel_id, channel_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("active_channel")
        .select("channel_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (channelsError) {
      setChannels([]);
      setActiveChannelRowId(undefined);
      setLoaded(true);
      return;
    }

    const mapped: ConnectedChannel[] = (channelRows ?? []).map((c) => ({
      id: c.id,
      youtubeChannelId: c.youtube_channel_id,
      channelName: c.channel_name,
    }));
    setChannels(mapped);

    // If there's no active-channel row yet but at least one channel exists
    // (e.g. right after connecting the first channel ever), default to the
    // first one rather than showing nothing.
    const resolvedActiveId = activeRow?.channel_id ?? mapped[0]?.id;
    setActiveChannelRowId(resolvedActiveId);
    setLoaded(true);
  }, [user, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const activeChannel = channels.find((c) => c.id === activeChannelRowId);

  /**
   * Registers a newly connected channel (already inserted into `channels`
   * by the connect API) as the active one. Does NOT remove other channels —
   * connecting is additive.
   */
  const saveChannel = useCallback(
    async (channelRowId: string) => {
      if (!user) return;
      const supabase = createClient();
      await supabase
        .from("active_channel")
        .upsert({ user_id: user.id, channel_id: channelRowId, updated_at: new Date().toISOString() });
      await load();
    },
    [user, load]
  );

  /** Switches the active channel among ones already connected. */
  const switchChannel = useCallback(
    async (channelRowId: string) => {
      if (!user) return;
      const supabase = createClient();
      await supabase
        .from("active_channel")
        .upsert({ user_id: user.id, channel_id: channelRowId, updated_at: new Date().toISOString() });
      setActiveChannelRowId(channelRowId);
    },
    [user]
  );

  /**
   * Disconnects a channel entirely — removes the channels row AND every
   * row that references it. The previous version only deleted `channels`,
   * leaving `active_channel` pointing at a now-nonexistent row (breaking
   * any code that resolves "the active channel" afterward) and
   * `channel_videos` cache data orphaned. `cases.channel_id` doesn't need
   * cleanup here — it's ON DELETE SET NULL at the DB level, so those
   * cases just become unclaimed again rather than broken.
   */
  const removeChannel = useCallback(
    async (channelRowId: string) => {
      if (!user) return;
      const supabase = createClient();

      await supabase.from("channel_videos").delete().eq("channel_id", channelRowId);

      if (activeChannelRowId === channelRowId) {
        await supabase.from("active_channel").delete().eq("user_id", user.id);
      }

      await supabase.from("channels").delete().eq("id", channelRowId).eq("user_id", user.id);
      await load();
    },
    [user, activeChannelRowId, load]
  );

  /** Clears the active channel selection without deleting any channel. */
  const clearActiveChannel = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("active_channel").delete().eq("user_id", user.id);
    setActiveChannelRowId(undefined);
  }, [user]);

  return {
    // Back-compat shape for existing code that reads `channelId`/`channelHandle`
    // as "the current channel":
    channelId: activeChannel?.youtubeChannelId,
    channelHandle: activeChannel?.channelName,
    // New multi-channel surface:
    channels,
    activeChannelRowId,
    loaded,
    saveChannel,
    switchChannel,
    removeChannel,
    clearActiveChannel,
  };
}