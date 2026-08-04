// src/app/api/channel/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrBuildChannelDNA } from "@/services/creatorDNA";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { createClient } from "@/lib/supabase/server";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

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

    const dna = await getOrBuildChannelDNA(channelSummary, userId);

    const videos = await youtubeProvider.getChannelVideos(channelSummary.uploadsPlaylistId, 50);

    const supabase = await createClient();
    const { data: channelRow, error: channelError } = await supabase
      .from("channels")
      .select("id")
      .eq("youtube_channel_id", channelSummary.channelId)
      .eq("user_id", userId)
      .single();

    if (channelError || !channelRow) {
      console.error("Could not find channel row for recommendations:", channelError?.message);
      return NextResponse.json({ dna, recommendations: null });
    }

    const recommendations = await generateRecommendations(supabase, channelRow.id, videos);

    return NextResponse.json({ dna, recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build Creator DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}