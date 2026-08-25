import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Any reservation still "reserved" after this long is dead — no
// legitimate script generation runs anywhere near this. Vercel kills
// individual section calls at 60s; a whole job stuck this long has
// either crashed mid-flight or been abandoned by the user.
const STALE_RESERVATION_MINUTES = 10;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - STALE_RESERVATION_MINUTES * 60 * 1000).toISOString();

  const { data: stale, error: fetchError } = await supabase
    .from("script_generations")
    .select("id, user_id")
    .eq("status", "reserved")
    .lt("created_at", cutoff);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!stale || stale.length === 0) {
    return NextResponse.json({ reconciled: 0 });
  }

  let reconciled = 0;
  for (const row of stale) {
    const { error: updateError } = await supabase
      .from("script_generations")
      .update({
        status: "failed",
        error: "Auto-reconciled: reservation exceeded expected generation time (likely a platform timeout)",
        completed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "reserved"); // guard against a race with a legit late completion

    if (updateError) continue;

    const { data: entitlement } = await supabase
      .from("user_entitlements")
      .select("credits, unlimited")
      .eq("user_id", row.user_id)
      .maybeSingle();

    if (entitlement && !entitlement.unlimited) {
      await supabase
        .from("user_entitlements")
        .update({ credits: entitlement.credits + 1, updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
    }

    reconciled++;
  }

  return NextResponse.json({ reconciled, totalStaleFound: stale.length });
}