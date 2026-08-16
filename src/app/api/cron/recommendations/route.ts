// src/app/api/cron/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateRecommendations } from "@/services/recommendations";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { ChannelDNA } from "@/services/creatorDNA";
import { applyBaseRegionOverride } from "@/services/creatorDNA";

const RETENTION_DAYS = 15;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, youtube_channel_id, channel_dna, base_region, recommendations, recommendations_generated_at");

  if (channelsError) {
    return NextResponse.json({ error: channelsError.message }, { status: 500 });
  }

  const results: { channelId: string; status: "ok" | "error"; message?: string }[] = [];

  for (const channel of channels ?? []) {
    try {
      if (channel.recommendations && channel.recommendations_generated_at) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

        await supabase.from("recommendation_history").insert({
          channel_id: channel.id,
          recommendations: channel.recommendations,
          generated_at: channel.recommendations_generated_at,
          expires_at: expiresAt.toISOString(),
        });
      }

      const summary = await youtubeProvider.getChannelSummaryById(channel.youtube_channel_id);
      if (!summary) {
        results.push({ channelId: channel.id, status: "error", message: "Channel not found on YouTube" });
        continue;
      }

      const videos = await youtubeProvider.getChannelVideos(summary.uploadsPlaylistId, 50);
      const rawDNA = channel.channel_dna as unknown as ChannelDNA | null;
      const channelDNA = rawDNA ? applyBaseRegionOverride(rawDNA, channel.base_region) : null;

      await generateRecommendations(supabase, channel.id, videos, channelDNA);
      results.push({ channelId: channel.id, status: "ok" });
    } catch (err) {
      results.push({
        channelId: channel.id,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  await supabase.from("recommendation_history").delete().lt("expires_at", new Date().toISOString());

  return NextResponse.json({ processed: results.length, results });
}