// src/app/api/news/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const supabase = await createClient();

  let query = supabase
    .from("case_alerts")
    .select(
      "id, provider, source_country, headline, url, source_name, published_at, summary, case_name, location, matched_case_id, status, created_at"
    )
    .order("published_at", { ascending: false, nullsFirst: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data ?? [] });
}