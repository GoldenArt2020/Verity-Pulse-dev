// src/app/api/channel/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrBuildChannelDNA } from "@/services/creatorDNA";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { createClient } from "@/lib/supabase/server";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

const MAX_CHANNELS_PER_USER = 6;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelSummary, userId } = body as {
      channelSummary: YouTubeChannelSummary;
      userId: string;
    };

    if (!channelSummary || !userId) {
      return NextResponse.json({ error: "Missing channelSummary or userId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { count, error: countError } = await supabase
      .from("channels")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Failed to count existing channels:", countError.message);
      return NextResponse.json({ error: "Could not verify channel limit" }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_CHANNELS_PER_USER) {
      return NextResponse.json(
        { error: `You can connect up to ${MAX_CHANNELS_PER_USER} channels. Remove one before adding another.` },
        { status: 409 }
      );
    }

    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("youtube_channel_id", channelSummary.channelId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ channelRowId: existing.id, alreadyConnected: true });
    }

    const dna = await getOrBuildChannelDNA(channelSummary, userId);

    const videos = await youtubeProvider.getChannelVideos(channelSummary.uploadsPlaylistId, 50);

    const { data: channelRow, error: channelError } = await supabase
      .from("channels")
      .select("id")
      .eq("youtube_channel_id", channelSummary.channelId)
      .eq("user_id", userId)
      .single();

    if (channelError || !channelRow) {
      console.error("Could not find channel row for recommendations:", channelError?.message);
      return NextResponse.json({ error: "Channel was not saved correctly" }, { status: 500 });
    }

    // Pass `dna` through so the >=80 scoring threshold actually applies
    // on first connect, instead of falling back to a flat unscored 50.
    const recommendations = await generateRecommendations(supabase, channelRow.id, videos, dna);

    return NextResponse.json({ dna, recommendations, channelRowId: channelRow.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build Creator DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}