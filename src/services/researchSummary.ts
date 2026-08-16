import { createClient } from "@/lib/supabase/server";

export interface ResearchSummary {
  sourcesAnalyzed: number;
  peopleIdentified: number;
  importantEvents: number;
  potentialLeads: number;
  confirmedClaims: number;
  conflictingClaims: number;
  unverifiedClaims: number;
  singleSourceClaims: number;
}

export interface ClaimComparisonRow {
  id: string;
  claim_summary: string;
  status: string;
  citations: { sourceId: string; sourceTitle: string; tier: number; statedValue: string }[];
}

export async function getResearchSummary(
  caseId: string
): Promise<{ summary: ResearchSummary; comparisons: ClaimComparisonRow[] }> {
  const supabase = await createClient();

  const [{ data: extractions }, { data: comparisons }] = await Promise.all([
    supabase
      .from("video_source_extractions")
      .select("people, locations, dates, claims, quotations, leads, video_sources!inner(case_id)")
      .eq("video_sources.case_id", caseId),
    supabase.from("case_claim_comparisons").select("id, claim_summary, status, citations").eq("case_id", caseId),
  ]);

  const rows = extractions ?? [];
  const uniquePeople = new Set<string>();
  let eventCount = 0;
  let leadCount = 0;
  for (const r of rows as any[]) {
    for (const p of r.people ?? []) uniquePeople.add(p.name);
    eventCount += (r.dates ?? []).length;
    leadCount += (r.leads ?? []).length;
  }

  const comparisonRows = (comparisons ?? []) as ClaimComparisonRow[];
  const summary: ResearchSummary = {
    sourcesAnalyzed: rows.length,
    peopleIdentified: uniquePeople.size,
    importantEvents: eventCount,
    potentialLeads: leadCount,
    confirmedClaims: comparisonRows.filter((c) => c.status === "CONFIRMED").length,
    conflictingClaims: comparisonRows.filter((c) => c.status === "CONFLICTING").length,
    unverifiedClaims: comparisonRows.filter((c) => c.status === "UNVERIFIED").length,
    singleSourceClaims: comparisonRows.filter((c) => c.status === "SINGLE_SOURCE").length,
  };

  return { summary, comparisons: comparisonRows };
}