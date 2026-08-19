// src/app/api/channel/refresh-recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { createClient } from "@/lib/supabase/server";
import type { ChannelDNA } from "@/services/creatorDNA";

export async function POST(req: NextRequest) {
  try {
    console.log("[refresh-recommendations] step 1: parsing body");
    const body = await req.json();
    const { youtubeChannelId } = body as { youtubeChannelId: string };

    if (!youtubeChannelId) {
      return NextResponse.json({ error: "Missing youtubeChannelId" }, { status: 400 });
    }

    console.log("[refresh-recommendations] step 2: creating supabase client");
    const supabase = await createClient();

    console.log("[refresh-recommendations] step 3: looking up channel row");
    const { data: channelRow, error: channelError } = await supabase
      .from("channels")
      .select("id, channel_dna")
      .eq("youtube_channel_id", youtubeChannelId)
      .single();

    if (channelError || !channelRow) {
      console.error("[refresh-recommendations] channel lookup failed:", channelError?.message);
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    console.log("[refresh-recommendations] step 4: fetching YouTube channel summary");
    const summary = await youtubeProvider.getChannelSummaryById(youtubeChannelId);
    if (!summary) {
      return NextResponse.json({ error: "Could not resolve channel from YouTube" }, { status: 502 });
    }

    console.log("[refresh-recommendations] step 5: fetching channel videos");
    const videos = await youtubeProvider.getChannelVideos(summary.uploadsPlaylistId, 50);

    console.log("[refresh-recommendations] step 6: calling generateRecommendations");
    const channelDNA = channelRow.channel_dna as unknown as ChannelDNA | null;
    const recommendations = await generateRecommendations(supabase, channelRow.id, videos, channelDNA);

    console.log("[refresh-recommendations] step 7: success, returning", recommendations.length, "recommendations");
    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("[refresh-recommendations] CAUGHT ERROR:", err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : "Failed to refresh recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}