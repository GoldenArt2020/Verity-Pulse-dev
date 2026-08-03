import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Next.js to treat this route as dynamic (prevents static evaluation at build time)
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify auth header to ensure only Vercel Cron can trigger this endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Initialize Supabase admin client INSIDE the handler function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch news/signals from your sources
    // const trendingSignals = await fetchTrendingSignals();
    
    // Placeholder structure for your research logic:
    /*
    for (const signal of trendingSignals) {
      const { data: existing } = await supabase
        .from("cases")
        .select("id")
        .eq("name", signal.title)
        .single();

      if (existing) continue;

      const researchResult = await analyzeCaseWithAI(signal);

      if (researchResult.opportunity_score >= 70) {
        await supabase.from("cases").insert({
          name: researchResult.title,
          country: researchResult.country,
          category: researchResult.category,
          summary: researchResult.summary,
          opportunity_score: researchResult.opportunity_score,
          status: "researched",
        });
      }
    }
    */

    return NextResponse.json({ success: true, message: "Research completed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}