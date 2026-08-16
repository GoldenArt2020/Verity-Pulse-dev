"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface ConnectedChannel {
  id: string; // channels.id (uuid) — the row's primary key, not the YouTube ID
  youtubeChannelId: string;
  channelName: string;
  baseRegion: string | null;
}

// How long a user must wait between switching their active channel — this
// exists to prevent channel-hopping to game per-channel systems that key
// off "the active channel" (region lock, case claiming/subniche exclusion,
// recommendation history). Does NOT apply to saveChannel — that's used
// right after connecting a brand-new channel (onboarding), not switching
// between already-connected ones, so it stays unrestricted.
const CHANNEL_SWITCH_COOLDOWN_DAYS = 15;
const CHANNEL_SWITCH_COOLDOWN_MS = CHANNEL_SWITCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function useChannelId() {
  const { user, isLoading: authLoading } = useAuthUser();
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [activeChannelRowId, setActiveChannelRowId] = useState<string | undefined>(undefined);
  const [activeChannelUpdatedAt, setActiveChannelUpdatedAt] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setChannels([]);
      setActiveChannelRowId(undefined);
      setActiveChannelUpdatedAt(undefined);
      setLoaded(true);
      return;
    }

    const supabase = createClient();

    const [{ data: channelRows, error: channelsError }, { data: activeRow }] = await Promise.all([
      supabase
        .from("channels")
        .select("id, youtube_channel_id, channel_name, base_region")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("active_channel")
        .select("channel_id, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (channelsError) {
      setChannels([]);
      setActiveChannelRowId(undefined);
      setActiveChannelUpdatedAt(undefined);
      setLoaded(true);
      return;
    }

    const mapped: ConnectedChannel[] = (channelRows ?? []).map((c) => ({
      id: c.id,
      youtubeChannelId: c.youtube_channel_id,
      channelName: c.channel_name,
      baseRegion: c.base_region ?? null,
    }));
    setChannels(mapped);

    const resolvedActiveId = activeRow?.channel_id ?? mapped[0]?.id;
    setActiveChannelRowId(resolvedActiveId);
    setActiveChannelUpdatedAt(activeRow?.updated_at ?? undefined);
    setLoaded(true);
  }, [user, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const activeChannel = channels.find((c) => c.id === activeChannelRowId);

  const nextSwitchAvailableAt = activeChannelUpdatedAt
    ? new Date(new Date(activeChannelUpdatedAt).getTime() + CHANNEL_SWITCH_COOLDOWN_MS)
    : null;
  const canSwitchChannel = !nextSwitchAvailableAt || Date.now() >= nextSwitchAvailableAt.getTime();

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

  const switchChannel = useCallback(
    async (channelRowId: string) => {
      if (!user) return;
      if (!canSwitchChannel && nextSwitchAvailableAt) {
        throw new Error(
          `You can switch channels again on ${nextSwitchAvailableAt.toLocaleDateString()}.`
        );
      }
      const supabase = createClient();
      await supabase
        .from("active_channel")
        .upsert({ user_id: user.id, channel_id: channelRowId, updated_at: new Date().toISOString() });
      setActiveChannelRowId(channelRowId);
      setActiveChannelUpdatedAt(new Date().toISOString());
    },
    [user, canSwitchChannel, nextSwitchAvailableAt]
  );

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

  const clearActiveChannel = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("active_channel").delete().eq("user_id", user.id);
    setActiveChannelRowId(undefined);
    setActiveChannelUpdatedAt(undefined);
  }, [user]);

  return {
    channelId: activeChannel?.youtubeChannelId,
    channelHandle: activeChannel?.channelName,
    channels,
    activeChannelRowId,
    loaded,
    saveChannel,
    switchChannel,
    removeChannel,
    clearActiveChannel,
    canSwitchChannel,
    nextSwitchAvailableAt,
    refresh: load,
  };
}