import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";

interface VictimDemographics {
  ethnicity: string | null;
  ageRange: string | null;
  gender: string | null;
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
  "coverageScore": number 0-10 (rough estimate of existing YouTube documentary coverage; if unknown, use 5),
  "imageQuery": string (a 2-5 word stock-photo search phrase that visually represents THIS specific case — a real location type, setting, or scene drawn from the case facts. NEVER a person's name or likeness — only places, objects, or atmosphere. Examples: "Liverpool residential street night", "rural Yorkshire coastal path fog", "Crown Court building exterior", "suburban cul-de-sac dusk". Base it on the actual location/setting mentioned in the source material, not a generic category.),
  "victimDemographics": {
    "ethnicity": string or null (only if explicitly stated or unambiguous from sources — never guess),
    "ageRange": string or null (e.g. "child", "teenager", "adult", "elderly" — only if determinable),
    "gender": string or null (only if explicitly stated)
  },
  "caseTypeTags": string[] (2-5 short factual case-type tags drawn ONLY from what's in the sources, e.g. "police-misconduct", "missing-person", "domestic-homicide", "institutional-failure", "cold-case", "child-safeguarding" — use whichever genuinely apply, do not force a tag that doesn't fit),
  "solvedStatus": "solved" | "unsolved" | "ongoing-investigation" (based on the source material)
}

SOURCE MATERIAL:
${sourcesText}

If the source material is too thin to determine a field confidently, use reasonable conservative defaults rather than inventing specifics. For victimDemographics fields specifically: leave as null rather than inferring or assuming — only populate from facts explicitly present in the sources. Return ONLY the JSON object.`;
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
 * First-pass research for a stub Case: Tavily search + ONE Groq call to
 * produce summary, category, tags, scores, a case-specific image search
 * query, AND demographic/case-type tagging (used by the recommendation
 * scoring engine's Audience DNA + Geographic filters). Saves the result
 * to the `cases` row. SERVER-ONLY — uses Tavily/Groq secret keys which
 * must never be read in the browser. Only ever imported from
 * /api/case/research/route.ts.
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

  const results = await tavilyProvider.search(caseName, 8);

  if (results.length === 0) {
    throw new Error(`No sources found for "${caseName}"`);
  }

  const sourcesText = results
    .map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}\nSource: ${r.url}`)
    .join("\n\n");

  const raw = await groqProvider.generateText(buildAnalysisPrompt(caseName, sourcesText), {
    temperature: 0.3,
    maxTokens: 1100,
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
    reliability: "MEDIUM" as const,
    type: "web",
  }));

  const { error: sourcesError } = await supabase.from("sources").insert(sourceRows);
  if (sourcesError) {
    console.error("Failed to save sources:", sourcesError.message);
  }
}