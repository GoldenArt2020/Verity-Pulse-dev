import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCaseResearch } from "@/services/caseResearch";

// Without this, Vercel falls back to a short default timeout for this
// route. This page's initial load chain (research -> generate-angle) can
// easily run past that default, and Vercel kills the connection mid-response
// rather than returning a clean error — which shows up in the browser as
// a full "This page couldn't load" navigation failure, not a normal error UI.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SEARCHABLE_COLUMNS = ["name", "category", "country", "summary"] as const;

/**
 * `.or()` takes a raw PostgREST filter expression, so commas, parens and
 * dots in user input are parsed as filter syntax rather than as data.
 * Double-quoting the value makes PostgREST treat it as a literal; `\` and
 * `"` are escaped so the quoting cannot be broken out of. LIKE wildcards
 * are escaped first, or a `%`/`_` in the term would match arbitrary text.
 */
function toIlikeFilterValue(raw: string): string {
  const likeEscaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, (char) => `\\${char}`);

  const quoteEscaped = likeEscaped
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  return `"%${quoteEscaped}%"`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const channelCategory = searchParams.get("category") || ""; // Channel DNA context

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Uses the session-bound client, not service role — RLS scopes this to
    // cases this user's channel(s) have already claimed, plus the
    // unclaimed pool. No more searching the whole platform's cases.
    const trimmedQuery = query.trim();
    const filterValue = toIlikeFilterValue(trimmedQuery);

    let dbQuery = supabase
      .from("cases")
      .select("id, name, country, category, summary, opportunity_score, created_at")
      .or(SEARCHABLE_COLUMNS.map((col) => `${col}.ilike.${filterValue}`).join(","));

    // Rank matching Channel DNA category first if available
    if (channelCategory) {
      dbQuery = dbQuery.order("category", { ascending: false });
    }

    const { data: existingCases, error } = await dbQuery
      .order("opportunity_score", { ascending: false })
      .limit(10);

    if (error) throw error;

    // 1. If matching cases already exist (claimed by this user or unclaimed), return them.
    if (existingCases && existingCases.length > 0) {
      return NextResponse.json(existingCases);
    }

    // 2. Nothing found — create a fresh, UNCLAIMED case stub and research
    // it on demand. Left unclaimed deliberately: this is a "discover" flow,
    // not a "commit to this case" flow. Actual claiming for a channel only
    // happens via getOrCreateCase.ts, when the user navigates into a case
    // from a recommendation or search result.
    const { data: stub, error: stubError } = await supabase
      .from("cases")
      .insert({
        name: trimmedQuery,
        status: "UNSOLVED",
        last_updated: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (stubError || !stub) {
      throw new Error(stubError?.message ?? "Failed to create case stub");
    }

    await runCaseResearch(stub.id, query);

    const { data: newCase } = await supabase
      .from("cases")
      .select("id, name, country, category, summary, opportunity_score, created_at")
      .eq("id", stub.id)
      .single();

    return NextResponse.json(newCase ? [newCase] : []);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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