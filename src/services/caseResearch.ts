import { createClient } from "@/lib/supabase/client";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";

export interface CaseStub {
  id: string;
  name: string;
}

/**
 * Returns the existing Case row for this name if one exists (case-insensitive),
 * otherwise creates a minimal stub row and returns it.
 * This is the ONLY place a Case row gets created — every other part of the app
 * (Discover, RecommendedForYou, search, etc.) should route through this
 * instead of inserting into `cases` directly.
 */
export async function getOrCreateCase(name: string): Promise<CaseStub> {
  const supabase = createClient();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Case name is required");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("cases")
    .select("id, name")
    .ilike("name", trimmedName)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to check for existing case: ${fetchError.message}`);
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("cases")
    .insert({
      name: trimmedName,
      status: "UNSOLVED",
      last_updated: new Date().toISOString(),
    })
    .select("id, name")
    .single();

  if (insertError) {
    throw new Error(`Failed to create case: ${insertError.message}`);
  }

  return created;
}

interface ResearchAnalysis {
  summary: string;
  country: string | null;
  category: string | null;
  tags: string[];
  opportunityScore: number;
  competitionScore: number;
  coverageScore: number;
}

function buildAnalysisPrompt(caseName: string, sourcesText: string): string {
  return `You are an editorial analyst for a true crime YouTube intelligence platform. Based on the source material below about "${caseName}", return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "summary": string (max 300 words, factual investigative-briefing tone, do not speculate beyond what sources state),
  "country": string or null,
  "category": string or null (e.g. "Missing Person", "Murder Investigation", "Cold Case"),
  "tags": string[] (3-6 short tags, e.g. "Unsolved", "Institutional Failure"),
  "opportunityScore": number 0-100 (how strong a documentary opportunity this is, based on evidence availability, public interest, and how well-documented it is),
  "competitionScore": number 0-100 (estimate based on how much media/public coverage already exists — high coverage = high competition),
  "coverageScore": number 0-10 (rough estimate of existing YouTube documentary coverage; if unknown, use 5)
}

SOURCE MATERIAL:
${sourcesText}

If the source material is too thin to determine a field confidently, use reasonable conservative defaults rather than inventing specifics. Return ONLY the JSON object.`;
}

function parseAnalysis(raw: string): ResearchAnalysis {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * First-pass research for a stub Case: Tavily search + ONE Groq call to
 * produce summary, category, tags, and scores. Saves the result to the
 * `cases` row. Does NOT touch YouTube or build Coverage Intelligence —
 * that's a heavier, separate pipeline for later.
 */
export async function runCaseResearch(caseId: string, caseName: string): Promise<void> {
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot research this case");
  }
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot analyze this case");
  }

  const results = await tavilyProvider.search(caseName, 8);

  if (results.length === 0) {
    throw new Error(`No sources found for "${caseName}"`);
  }

  const sourcesText = results
    .map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}\nSource: ${r.url}`)
    .join("\n\n");

  // ONE Groq call for the whole case — not one per source
  const raw = await groqProvider.generateText(buildAnalysisPrompt(caseName, sourcesText), {
    temperature: 0.3,
    maxTokens: 900,
  });

  const analysis = parseAnalysis(raw);

  const supabase = createClient();
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      summary: analysis.summary,
      country: analysis.country,
      category: analysis.category,
      tags: analysis.tags,
      opportunity_score: analysis.opportunityScore,
      competition_score: analysis.competitionScore,
      coverage_score: analysis.coverageScore,
      last_updated: new Date().toISOString(),
    })
    .eq("id", caseId);

  if (updateError) {
    throw new Error(`Failed to save research: ${updateError.message}`);
  }

  // Save sources too, so KeyDocuments/TopIntelligenceSources have real data later
  const sourceRows = results.map((r) => ({
    case_id: caseId,
    publisher: r.source ?? new URL(r.url).hostname,
    url: r.url,
    date: r.publishedDate ?? null,
    reliability: "MEDIUM" as const,
    type: "web",
  }));

  const { error: sourcesError } = await supabase.from("sources").insert(sourceRows);
  if (sourcesError) {
    // Don't fail the whole research pass over sources — log and continue
    console.error("Failed to save sources:", sourcesError.message);
  }
}