import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runCaseResearch } from "@/services/caseResearch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const channelCategory = searchParams.get("category") || ""; // Channel DNA context

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Search existing real cases from the database (matches titles, summaries, tags)
    let dbQuery = supabase
      .from("cases")
      .select("id, name, country, category, summary, opportunity_score, created_at")
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,country.ilike.%${query}%,summary.ilike.%${query}%`);

    // Rank matching Channel DNA category first if available
    if (channelCategory) {
      dbQuery = dbQuery.order("category", { ascending: false });
    }

    const { data: existingCases, error } = await dbQuery
      .order("opportunity_score", { ascending: false })
      .limit(10);

    if (error) throw error;

    // 2. If real cases exist, return them formatted immediately
    if (existingCases && existingCases.length > 0) {
      return NextResponse.json(existingCases);
    }

    // 3. Fallback: If no real case exists yet in DB for the query, trigger AI deep research on demand
    const newCaseId = `search-${Date.now()}`;
    await runCaseResearch(newCaseId, query);

    // Fetch newly created case record
    const { data: newCase } = await supabase
      .from("cases")
      .select("id, name, country, category, summary, opportunity_score, created_at")
      .eq("name", query)
      .single();

    return NextResponse.json(newCase ? [newCase] : []);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Preserve existing POST handler for explicit trigger calls
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, caseName } = body as { caseId: string; caseName: string };

    if (!caseId || !caseName) {
      return NextResponse.json({ error: "Missing caseId or caseName" }, { status: 400 });
    }

    await runCaseResearch(caseId, caseName);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to research case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}