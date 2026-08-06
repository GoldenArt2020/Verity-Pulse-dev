import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateScriptForAngle } from "@/services/scriptWriter";
import type { ChannelDNA } from "@/services/creatorDNA";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const angleId = body?.angleId as string | undefined;
  const caseId = body?.caseId as string | undefined;

  if (!angleId || !caseId) {
    return NextResponse.json({ error: "angleId and caseId are required" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Write in the requesting user's currently active channel's voice. If no
  // active channel is set, the script still generates without channel DNA.
  const { data: activeRow } = await supabase
    .from("active_channel")
    .select("channel_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let channelDNA: ChannelDNA | null = null;
  if (activeRow?.channel_id) {
    const { data: channelRow } = await supabase
      .from("channels")
      .select("channel_dna")
      .eq("id", activeRow.channel_id)
      .maybeSingle();
    channelDNA = (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
  }

  try {
    const script = await generateScriptForAngle(angleId, caseId, channelDNA);
    return NextResponse.json({ script });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate script" },
      { status: 500 }
    );
  }
}