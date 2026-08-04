// src/app/api/channel/refresh-recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { createClient } from "@/lib/supabase/server";
import type { ChannelDNA } from "@/services/creatorDNA";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtubeChannelId } = body as { youtubeChannelId: string };

    if (!youtubeChannelId) {
      return NextResponse.json({ error: "Missing youtubeChannelId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: channelRow, error: channelError } = await supabase
      .from("channels")
      .select("id, channel_dna")
      .eq("youtube_channel_id", youtubeChannelId)
      .single();

    if (channelError || !channelRow) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const summary = await youtubeProvider.getChannelSummaryById(youtubeChannelId);
    if (!summary) {
      return NextResponse.json({ error: "Could not resolve channel from YouTube" }, { status: 502 });
    }

    const videos = await youtubeProvider.getChannelVideos(summary.uploadsPlaylistId, 50);
    const channelDNA = channelRow.channel_dna as unknown as ChannelDNA | null;
    const recommendations = await generateRecommendations(supabase, channelRow.id, videos, channelDNA);

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refresh recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}