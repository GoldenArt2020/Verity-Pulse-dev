// src/app/api/channel/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connectChannel } from "@/services/connectChannel";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelSummary, userId, baseRegion } = body as {
      channelSummary: YouTubeChannelSummary;
      userId: string;
      baseRegion?: string | null;
    };
    if (!channelSummary || !userId) {
      return NextResponse.json({ error: "Missing channelSummary or userId" }, { status: 400 });
    }
    const supabase = await createClient();
    const result = await connectChannel(supabase, channelSummary, userId, baseRegion ?? null);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build Creator DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}