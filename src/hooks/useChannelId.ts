"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface ConnectedChannel {
  id: string; // channels.id (uuid) — the row's primary key, not the YouTube ID
  youtubeChannelId: string;
  channelName: string;
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
      // Auth hasn't resolved yet — don't decide "no channels" prematurely,
      // or the onboarding form flashes before real auth/channel data loads.
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
        .select("id, youtube_channel_id, channel_name")
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
    }));
    setChannels(mapped);

    // If there's no active-channel row yet but at least one channel exists
    // (e.g. right after connecting the first channel ever), default to the
    // first one rather than showing nothing.
    const resolvedActiveId = activeRow?.channel_id ?? mapped[0]?.id;
    setActiveChannelRowId(resolvedActiveId);
    setActiveChannelUpdatedAt(activeRow?.updated_at ?? undefined);
    setLoaded(true);
  }, [user, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const activeChannel = channels.find((c) => c.id === activeChannelRowId);

  // No prior switch on record (e.g. first channel ever, or the default-
  // to-first-channel fallback above with no real active_channel row yet)
  // means there's nothing to cool down from — switching is allowed.
  const nextSwitchAvailableAt = activeChannelUpdatedAt
    ? new Date(new Date(activeChannelUpdatedAt).getTime() + CHANNEL_SWITCH_COOLDOWN_MS)
    : null;
  const canSwitchChannel = !nextSwitchAvailableAt || Date.now() >= nextSwitchAvailableAt.getTime();

  /**
   * Registers a newly connected channel (already inserted into `channels`
   * by the connect API) as the active one. Does NOT remove other channels —
   * connecting is additive. Not subject to the switch cooldown — this is
   * onboarding a new channel, not hopping between existing ones.
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

  /**
   * Switches the active channel among ones already connected. Enforced
   * here (not just disabled in the UI) so it can't be bypassed by calling
   * this directly — throws if still within the cooldown window rather
   * than silently no-op-ing, so the caller can show why it was blocked.
   */
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
    setActiveChannelUpdatedAt(undefined);
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
    // Switch cooldown surface:
    canSwitchChannel,
    nextSwitchAvailableAt,
  };
}