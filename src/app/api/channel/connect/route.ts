import { NextRequest, NextResponse } from "next/server";
import { getOrBuildChannelDNA } from "@/services/creatorDNA";
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
    return NextResponse.json({ dna });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build Creator DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}