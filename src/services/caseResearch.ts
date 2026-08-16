import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { SearchResult } from "@/providers/search/types";
import { classifySourceReliability, formatSourcesWithReliability } from "@/lib/sourceReliability";
import { runBackgroundResearch } from "@/services/backgroundResearch";
import { getOrFetchYouTubeCoverage } from "@/services/youtubeCoverage";

interface VictimDemographics {
  ethnicity: string | null;
  ageRange: string | null;
  gender: string | null;
}

interface CaseFacts {
  people: { name: string; role: string; details: string }[];
  timeline: { date: string; event: string }[];
  charges: string[];
  keyFigures: string[];
  locations: string[];
  unresolvedQuestions: string[];
}

interface ResearchAnalysis {
  summary: string;
  country: string | null;
  category: string | null;
  tags: string[];
  opportunityScore: number;
  competitionScore: number;
  coverageScore: number;
  imageQuery: string;
  victimDemographics: VictimDemographics;
  caseTypeTags: string[];
  solvedStatus: "solved" | "unsolved" | "ongoing-investigation";
  caseFacts: CaseFacts;
}

// Fan out into several angled queries instead of one generic search, so we
// actually surface victim details, timeline, and legal-status facts rather
// than whatever a single "case name" search happens to return.
function buildResearchQueries(caseName: string): string[] {
  return [
    caseName,
    `${caseName} victims injured`,
    `${caseName} timeline what happened`,
    `${caseName} charges court hearing trial`,
    `${caseName} latest news update`,
  ];
}

async function gatherSources(caseName: string): Promise<SearchResult[]> {
  const queries = buildResearchQueries(caseName);
  const batches = await Promise.all(
    queries.map((q) => tavilyProvider.search(q, 6).catch(() => [] as SearchResult[]))
  );
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const batch of batches) {
    for (const r of batch) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      merged.push(r);
    }
  }
  return merged;
}

function buildAnalysisPrompt(caseName: string, sourcesText: string): string {
  return `You are an investigative research analyst for a true crime YouTube intelligence platform. Based on the source material below about "${caseName}", return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "summary": string (max 300 words, factual investigative-briefing tone, do not speculate beyond what sources state),
  "country": string or null,
  "category": string or null (e.g. "Missing Person", "Murder Investigation", "Cold Case"),
  "tags": string[] (3-6 short tags),
  "opportunityScore": number 0-100,
  "competitionScore": number 0-100 (ROUGH PLACEHOLDER ONLY — overwritten moments later with a real number once actual YouTube video data is fetched. Base this purely on how much THIS EXACT CASE has likely already been covered by OTHER TRUE CRIME YOUTUBE CREATORS specifically. This is NOT the same as general news/media attention — a case can be all over the news with zero YouTube coverage, or vice versa. If genuinely unsure, use 30 rather than guessing high),
  "coverageScore": number 0-10 (if unknown, use 5 — this is only a fallback used when real YouTube coverage data can't be fetched),
  "imageQuery": string (2-5 word stock-photo phrase — a place/object/atmosphere, NEVER a person),
  "victimDemographics": { "ethnicity": string or null, "ageRange": string or null, "gender": string or null },
  "caseTypeTags": string[] (2-5 tags),
  "solvedStatus": "solved" | "unsolved" | "ongoing-investigation",
  "caseFacts": {
    "people": [ { "name": string, "role": string (e.g. "victim", "accused", "witness"), "details": string (age, occupation, relevant background — every fact stated in the sources, not summarized away) } ],
    "timeline": [ { "date": string (as specific as the sources allow), "event": string } ] (every dated event the sources mention, in order),
    "charges": string[] (exact charges, including any that changed over time, e.g. "attempted murder \u2192 upgraded to murder"),
    "keyFigures": string[] (every concrete, citable number, measurement, or quoted line from the sources — alcohol readings, distances, amounts raised, exact quotes attributed to named people, sentencing details, etc. Keep each as a short standalone fact),
    "locations": string[] (specific named locations from the sources),
    "unresolvedQuestions": string[] (what the sources explicitly say is still unknown or unresolved, e.g. pending trial, unidentified suspect, undetermined motive)
  }
}

Each source below is tagged [HIGH], [MEDIUM], or [LOW] reliability. Prefer HIGH and MEDIUM sources for factual claims in "summary" and "caseFacts" — treat LOW-tier sources as context only, and do not state something as established fact if it only appears in a LOW-tier source.

SOURCE MATERIAL:
${sourcesText}

Extract EVERY concrete fact present in the sources into the appropriate caseFacts field — names, ages, dates, figures, quotes. Do not compress or generalize here; that's what "summary" is for. Never invent a fact not present in the sources. If a field has nothing to report, return an empty array rather than inventing content. Return ONLY the JSON object.`;
}

function parseAnalysis(raw: string): ResearchAnalysis {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse AI JSON response: ${(err as Error).message}\nRaw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

/**
 * First-pass research for a stub Case: multi-query Tavily search (case
 * name, victims, timeline, charges/court, latest news) + ONE Groq call to
 * produce summary, category, tags, scores, a case-specific image search
 * query, demographic/case-type tagging, AND a structured case_facts
 * dossier (named people, dated timeline, charges, key figures/quotes,
 * locations, unresolved questions) that later angle and script generation
 * draw from directly instead of only the compressed summary. Every source
 * is tagged HIGH/MEDIUM/LOW reliability (see src/lib/sourceReliability.ts)
 * so the model — and later prompts reusing these sources — knows which
 * claims to trust for stated fact vs. context only. Saves the result to
 * the `cases` row, then runs two non-fatal second-pass steps: background
 * research (see src/services/backgroundResearch.ts) off the named people
 * just extracted, and real YouTube coverage data (see
 * src/services/youtubeCoverage.ts) so the Angle Builder header shows an
 * actual data-driven coverage score immediately rather than waiting until
 * angles are generated.
 * SERVER-ONLY — uses Tavily/Groq secret keys which must never be read in
 * the browser. Only ever imported from /api/case/research/route.ts.
 *
 * `victimDemographics`/`caseTypeTags`/`solvedStatus` are extracted
 * cautiously — the prompt explicitly instructs the model to leave
 * demographic fields null rather than guess, since these feed the
 * recommendation engine's audience-matching logic and a wrong or
 * invented tag here would silently bias future recommendations.
 */
export async function runCaseResearch(caseId: string, caseName: string): Promise<void> {
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot research this case");
  }
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot analyze this case");
  }

  const results = await gatherSources(caseName);

  if (results.length === 0) {
    throw new Error(`No sources found for "${caseName}"`);
  }

  const sourcesText = formatSourcesWithReliability(results, 800);

  const raw = await groqProvider.generateText(buildAnalysisPrompt(caseName, sourcesText), {
    temperature: 0.3,
    maxTokens: 4000,
  });

  const analysis = parseAnalysis(raw);

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      summary: analysis.summary,
      country: analysis.country,
      category: analysis.category,
      opportunity_score: analysis.opportunityScore,
      competition_score: analysis.competitionScore,
      coverage_score: analysis.coverageScore,
      image_query: analysis.imageQuery,
      victim_demographics: analysis.victimDemographics,
      case_type_tags: analysis.caseTypeTags,
      solved_status: analysis.solvedStatus,
      case_facts: analysis.caseFacts,
      last_updated: new Date().toISOString(),
    })
    .eq("id", caseId);

  if (updateError) {
    throw new Error(`Failed to save research: ${updateError.message}`);
  }

  const sourceRows = results.map((r) => ({
    case_id: caseId,
    publisher: r.source ?? new URL(r.url).hostname,
    url: r.url,
    date: r.publishedDate ?? null,
    reliability: classifySourceReliability(r.url),
    type: "web",
  }));

  const { error: sourcesError } = await supabase.from("sources").insert(sourceRows);
  if (sourcesError) {
    console.error("Failed to save sources:", sourcesError.message);
  }

  // Second pass: named victim/suspect background profiles, run
  // automatically off the people just extracted above. Non-fatal — if this
  // fails, the primary research above has already succeeded and saved, so
  // we log and move on rather than failing the whole research step.
  try {
    await runBackgroundResearch(caseId, caseName, analysis.caseFacts.people ?? []);
  } catch (err) {
    console.error("Background research failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  // Real YouTube coverage (channel-by-channel view data), run right after
  // the main research so the Angle Builder header shows an actual
  // data-driven score immediately rather than waiting until angles are
  // generated. Non-fatal for the same reason as background research above.
  try {
    await getOrFetchYouTubeCoverage(caseId, caseName);
  } catch (err) {
    console.error("YouTube coverage fetch failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}