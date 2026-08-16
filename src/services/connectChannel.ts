// src/services/connectChannel.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrBuildChannelDNA } from "@/services/creatorDNA";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

const MAX_CHANNELS_PER_USER = 6;

export interface ConnectChannelResult {
  channelRowId: string;
  alreadyConnected?: boolean;
  dna?: unknown;
  recommendations?: unknown;
}

/**
 * Shared connect logic used by both the manual handle-paste flow
 * (`/api/channel/connect`) and the OAuth-based connect flow (the
 * YouTube-Analytics-aware callback). Keeping this in one place means DNA
 * building, video fetching, and recommendation generation never drift
 * between the two entry points.
 */
export async function connectChannel(
  supabase: SupabaseClient,
  channelSummary: YouTubeChannelSummary,
  userId: string,
  baseRegion?: string | null
): Promise<ConnectChannelResult> {
  const { count, error: countError } = await supabase
    .from("channels")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error("Could not verify channel limit");
  }

  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", channelSummary.channelId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { channelRowId: existing.id, alreadyConnected: true };
  }

  if ((count ?? 0) >= MAX_CHANNELS_PER_USER) {
    throw new Error(`You can connect up to ${MAX_CHANNELS_PER_USER} channels. Remove one before adding another.`);
  }

  const dna = await getOrBuildChannelDNA(channelSummary, userId, baseRegion);
  const videos = await youtubeProvider.getChannelVideos(channelSummary.uploadsPlaylistId, 50);

  const { data: channelRow, error: channelError } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", channelSummary.channelId)
    .eq("user_id", userId)
    .single();

  if (channelError || !channelRow) {
    throw new Error("Channel was not saved correctly");
  }

  const recommendations = await generateRecommendations(supabase, channelRow.id, videos, dna);

  return { channelRowId: channelRow.id, dna, recommendations };
}