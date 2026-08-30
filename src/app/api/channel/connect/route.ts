// src/app/api/channel/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connectChannel } from "@/services/connectChannel";
import type { YouTubeChannelSummary } from "@/providers/youtube/types";

// connectChannel builds Creator DNA, fetches 50 videos, and generates
// recommendations — well past the default serverless limit on Vercel.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // userId comes from the verified session, never the request body — a
    // client-supplied userId lets any caller attach a channel to any account,
    // and read back the DNA and recommendations generated for it.
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { channelSummary, baseRegion } = body as {
      channelSummary: YouTubeChannelSummary;
      baseRegion?: string | null;
    };

    if (!channelSummary?.channelId) {
      return NextResponse.json({ error: "Missing channelSummary" }, { status: 400 });
    }

    const result = await connectChannel(supabase, channelSummary, user.id, baseRegion ?? null);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build Creator DNA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}