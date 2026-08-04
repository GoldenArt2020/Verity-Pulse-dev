import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const youtubeChannelId = searchParams.get("youtubeChannelId");

  if (!youtubeChannelId) {
    return NextResponse.json({ error: "Missing youtubeChannelId" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: channelRow, error: channelError } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", youtubeChannelId)
    .single();

  if (channelError || !channelRow) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("recommendation_history")
    .select("id, recommendations, generated_at, expires_at")
    .eq("channel_id", channelRow.id)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}