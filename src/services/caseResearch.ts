import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { youtubePublicCaptionsProvider } from "@/providers/transcript/youtubePublicCaptionsProvider";
import { aiRouter } from "@/providers/ai/router";
import { groqProvider } from "@/providers/ai/groqProvider";
import { after } from "next/server";
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

interface DetailedPersonRecord {
  name: string;
  role: "victim" | "accused" | "perpetrator" | "official" | "witness" | "other";
  age: string | null;
  wayOfLife: string | null;
  whatTheyDidThatDay: string | null;
  priorHistory: string | null;
  actionsTaken: string | null;
  statedMotiveOrReason: string | null;
  documentedStatements: string | null;
  beliefsOrMindset: string | null;
  outcome: string | null;
  confessionStatus: string | null;
  aliveStatus: string | null;
  additionalNotes: string | null;
}

interface ResearchAnalysis {
  summary: string;
  country: string | null;
  city: string | null;
  incidentDate: string | null;
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

// News-outlet/official uploads are the most reliable transcript sources for
// factual extraction — press conferences, official statements, court
// coverage — as opposed to independent creator commentary/reaction videos.
// Channel-name patterns suggesting an official or news-outlet upload rather
// than independent creator commentary. Word-boundary matched: a bare substring
// test on "pd" also matches "Podcast" and "Update", which let commentary
// channels sort as official.
const RELIABLE_TRANSCRIPT_CHANNEL_PATTERNS: RegExp[] = [
  /\bpolice\b/, /\bsheriff\b/, /\bpress conference\b/, /\bdistrict attorney\b/,
  /\bprosecutor\b/, /\bcoroner\b/, /\bp\.?d\.?\b/, /\b[a-z]{2,}pd\b/,
  /\bcounty\b/, /\bcourt(s|house|room)?\b/, /\bnews(room)?\b/,
  /\babc\s?\d/, /\bnbc\b/, /\bcbs\b/, /\bfox\s?\d/,
];

function looksReliableForTranscript(channelTitle: string | null | undefined): boolean {
  if (!channelTitle) return false;
  const lower = channelTitle.toLowerCase();
  return RELIABLE_TRANSCRIPT_CHANNEL_PATTERNS.some((pattern) => pattern.test(lower));
}

function buildResearchQueries(caseName: string): string[] {
  return [
    caseName,
    `${caseName} victims timeline what happened`,
    `${caseName} charges court hearing trial latest news`,
  ];
}

async function gatherSources(caseName: string): Promise<SearchResult[]> {
  const newsQuery = { q: `${caseName} news`, options: { topic: "news" as const, days: 365 } };
  const generalQueries = buildResearchQueries(caseName).map((q) => ({ q, options: undefined }));

  const batches = await Promise.all([
    ...generalQueries.map(({ q }) => tavilyProvider.search(q, 6).catch(() => [] as SearchResult[])),
    tavilyProvider.search(newsQuery.q, 6, newsQuery.options).catch(() => [] as SearchResult[]),
  ]);

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

/**
 * Pulls up to 15 candidate case videos, prioritizes the most likely-reliable
 * ones (official/news uploads), and fetches full transcripts for the top 5
 * of those. Non-fatal at every step — a transcript failure or empty result
 * just means less source material, not a broken research run.
 */
async function gatherYouTubeTranscripts(caseName: string): Promise<string> {
  try {
    const videos = await youtubeProvider.searchCaseVideos(caseName, 15);
    if (!videos.length) return "";

    // Only channels that actually match. This previously sorted by the
    // heuristic then took the top 5 regardless, so auto-generated captions
    // from commentary channels reached the prompt as primary source material.
    const candidates = videos.filter((v) => looksReliableForTranscript(v.channelTitle)).slice(0, 5);
    if (!candidates.length) return "";

    const transcripts = await Promise.all(
      candidates.map(async (v) => {
        try {
          const result = await youtubePublicCaptionsProvider.fetchTranscript(v.videoId);
if (result.status !== "available" || !result.rawText?.trim()) return null;
return `--- YouTube video: "${v.title}" (channel: ${v.channelTitle ?? "unknown"}) ---\n${result.rawText.slice(0, 8000)}`;
        } catch {
          return null;
        }
      })
    );

    return transcripts.filter((t): t is string => t !== null).join("\n\n");
  } catch {
    return "";
  }
}
function buildAnalysisPrompt(caseName: string, sourcesText: string): string {
  return `You are an investigative research analyst for a true crime YouTube intelligence platform. Based on the sourcematerial below about "${caseName}", return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "summary": string (max 300 words, factual investigative-briefing tone, do not speculate beyond what sources state),
  "country": string or null,
  "city": string or null (the specific city, borough, town or neighborhood where the incident occurred),
  "incidentDate": string or null (the date of the incident itself, as specific as the sources allow, e.g. "August 23, 2026" or "late August 2026" - NOT the date of the arrest, charging or any later development),
  "category": string or null (e.g. "Missing Person", "Murder Investigation", "Cold Case"),
  "tags": string[] (3-6 short tags),
  "opportunityScore": number 0-100,
  "competitionScore": number 0-100 (ROUGH PLACEHOLDER ONLY — overwritten moments later with a real number once actualYouTube video data is fetched. Base this purely on how much THIS EXACT CASE has likely already been covered by OTHER TRUE CRIME YOUTUBE CREATORS specifically. This is NOT the same as general news/media attention — a case can be all over the news with zero YouTube coverage, or vice versa. If genuinely unsure, use 30 rather than guessing high),
  "coverageScore": number 0-10 (if unknown, use 5 — this is only a fallback used when real YouTube coverage data can't be fetched),
  "imageQuery": string (2-5 word stock-photo phrase — a place/object/atmosphere, NEVER a person),
  "victimDemographics": { "ethnicity": string or null, "ageRange": string or null, "gender": string or null },
  "caseTypeTags": string[] (2-5 tags),
  "solvedStatus": "solved" | "unsolved" | "ongoing-investigation",
  "caseFacts": {
    "people": [ { "name": string, "role": string (e.g. "victim", "accused", "witness"), "details": string (age, occupation, relevant background — every fact stated in the sources, not summarized away) } ],
    "timeline": [ { "date": string (as specific as the sources allow), "event": string } ] (every dated event the sources mention, in order),
    "charges": string[] (exact charges, including any that changed over time, e.g. "attempted murder → upgraded to murder"),
    "keyFigures": string[] (every concrete, citable number, measurement, or quoted line from the sources — alcohol readings, distances, amounts raised, exact quotes attributed to named people, sentencing details, etc. Keep each as a short standalone fact),
    "locations": string[] (specific named locations from the sources),
    "unresolvedQuestions": string[] (what the sources explicitly say is still unknown or unresolved, e.g. pending trial, unidentified suspect, undetermined motive)
  }
}

Each source below is tagged [HIGH], [MEDIUM], or [LOW] reliability. Prefer HIGH and MEDIUM sources for factual claims in "summary" and "caseFacts" — treat LOW-tier sources as context only, and do not state something as established fact if it only appears in a LOW-tier source. YouTube transcript excerpts, where included below, come from channels whose NAMES suggest an official or news source. That is a heuristic on the channel title only - it is not verification. Treat them as MEDIUM reliability reporting, never as primary material, and never state something as established fact on a transcript alone.

SOURCE MATERIAL:
${sourcesText}

REQUIRED COVERAGE CHECK - do this before returning:
Certain categories of fact are predictable from the shape of a case, and their absence from your source material is a RETRIEVAL FAILURE, not evidence the information does not exist. Work through the applicable ones below. For each category the sources do NOT cover, add an entry to caseFacts.unresolvedQuestions phrased as a retrieval gap - e.g. "Not retrieved: whether the accused was under any form of supervision at the time" - and NEVER phrase it as an absence in the public record.
- If anyone has been arrested: the full charge list, the arrest date, and custody status.
- If a named person is accused: their prior criminal record, or an explicit statement that sources covering this incident do not describe one.
- If the accused had any prior conviction: whether they were on parole, probation or other supervision when this incident occurred.
- What evidence investigators relied on - footage, forensics, witnesses, tips - and how the suspect was identified.
- For every victim: name, age, and any biographical detail the sources provide.
- Whether any survivor or witness has given a public account.
This distinction matters: a script built on this briefing will otherwise tell viewers that facts are missing from the public record when they were merely missing from this search.

Extract EVERY concrete fact present in the sources into the appropriate caseFacts field — names, ages, dates, figures, quotes. Do not compress or generalize here; that's what "summary" is for. Never invent a fact not present in the sources. If a field has nothing to report, return an empty array rather than inventing content. Return ONLY the JSON object.`;
}

function buildDetailedPeoplePrompt(caseName: string, sourceText: string): string {
  return `You are building an exhaustive, individually-verified factual record for every named person central to the case "${caseName}", based strictly on the source material below.

CRITICAL RULES:
1. Process ONE PERSON AT A TIME. Independently determine each person's own facts — age, activities, history, actions — drawing ONLY from what the source material actually says about THAT SPECIFIC PERSON. Never assume two people share a trait, action, motive, or outcome just because they're connected to the same case. If four people are accused, produce four independently-reasoned records.

2. MOTIVE AND BELIEF ARE THE HIGHEST-RISK FIELDS. Fill "statedMotiveOrReason" and "beliefsOrMindset" ONLY when a source directly and explicitly attributes that reason or belief to this specific person — a quote, a court finding, a documented statement, an official account attributing intent. Do NOT infer a motive from someone's actions, do NOT guess a plausible reason, and do NOT fill these fields just because a motive "would make sense." These fields should very often be null. Leaving them null and correct is far better than filling them with a plausible-sounding guess. If a motive was alleged by prosecutors but never confirmed, say so explicitly and attribute it: "Prosecutors alleged [X] as motive; not confirmed by [person]."

3. Every other field follows the same discipline: if the source material doesn't clearly establish something for this specific person, write null — do not fill a gap with an assumption, even a reasonable-sounding one.

4. Quotes in "documentedStatements" must be real, attributed statements from the source material — never invented or paraphrased as if verbatim.

5. IDENTITY IS NOT ESTABLISHED BY A NAME MATCH. Sources are found by keyword search, so some results describe a DIFFERENT person who shares a name with someone in this case. Namesakes are common. A prior conviction, prior arrest, prior case, court docket or appellate opinion may go in "priorHistory" ONLY if a source covering THIS incident makes that connection itself. A court record surfaced by a name search is never sufficient on its own, however exactly the name matches. Court records are the highest-risk material here precisely because they are real, quotable and indexed by name; being accurate about the wrong person is still a factual error. Check for mismatched identifiers before attributing anything: an age or date of birth inconsistent with this case, a different middle name or surname variant, a different state or jurisdiction, an impossible timeline. Any one of those means treat it as a different person and leave "priorHistory" null.

6. NATURAL PERSONS ONLY. Never create an entry for an organisation, agency, department, company or news outlet (e.g. NYPD, FBI, a sheriff's office, a broadcaster). Every entry must be an individual human being. What an agency did or said is not a person record.

7. NEVER INFER AN OCCUPATION, TITLE OR CREDENTIAL FROM A NAME. Name particles that resemble titles are parts of the name, not qualifications — "MD" and "Md." are common transliterations of Mohammed, and similar fragments appear across many naming traditions. Fill "wayOfLife" only when a source explicitly states what the person did for a living. Leave it null otherwise. Inventing a profession from a name fragment is a serious factual error about a real person.

8. REPRODUCE NUMBERS EXACTLY as the sources state them — ages, sentence lengths, counts of charges or arrests, dollar amounts. Do not round, average or approximate. If two sources give different figures, use the figure from the source covering this incident and note the discrepancy in "additionalNotes".

9. SPELL EVERY NAME exactly as the sources spell it, and spell it identically in every field. A misspelled name is a different person.

10. NAME LOCATIONS exactly as the sources name them. Do not substitute a generic category of place for a specific named venue (e.g. do not write "a bodega" where sources name a particular grill, deli or restaurant), and do not change the type of establishment.

SOURCE MATERIAL:
${sourceText}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{
  "people": [
    {
      "name": string,
      "role": "victim" | "accused" | "perpetrator" | "official" | "witness" | "other",
      "age": string | null,
      "wayOfLife": string | null,
      "whatTheyDidThatDay": string | null,
      "priorHistory": string | null,
      "actionsTaken": string | null,
      "statedMotiveOrReason": string | null,
      "documentedStatements": string | null,
      "beliefsOrMindset": string | null,
      "outcome": string | null,
      "confessionStatus": string | null,
      "aliveStatus": string | null,
      "additionalNotes": string | null
    }
  ]
}

Include an entry for every named victim, accused/convicted person, identified perpetrator, and any other person central to how the case unfolded. Return ONLY the JSON object.`;
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

function parseDetailedPeople(raw: string): { people: DetailedPersonRecord[] } {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in detailed people response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse detailed people JSON: ${(err as Error).message}`);
  }
}

export async function runCaseResearch(caseId: string, caseName: string): Promise<void> {
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot research this case");
  }
  if (!aiRouter.isConfigured()) {
    throw new Error("No AI provider is configured — cannot analyze this case");
  }

  const [results, transcriptText] = await Promise.all([
    gatherSources(caseName),
    gatherYouTubeTranscripts(caseName),
  ]);

  if (results.length === 0 && !transcriptText) {
    throw new Error(`No sources found for "${caseName}"`);
  }

  const sourcesText = formatSourcesWithReliability(results, 3000);
  const combinedSourceText = transcriptText ? `${sourcesText}\n\n${transcriptText}` : sourcesText;

  const [rawAnalysis, rawDetailedPeople] = await Promise.all([
    aiRouter.generateText(buildAnalysisPrompt(caseName, combinedSourceText), {
      temperature: 0.3,
      maxTokens: 3000,
    }),
    groqProvider.generateText(buildDetailedPeoplePrompt(caseName, combinedSourceText), {
      temperature: 0.2,
      maxTokens: 4000,
    }),
  ]);

  const analysis = parseAnalysis(rawAnalysis);

  let detailedPeople: DetailedPersonRecord[] = [];
  try {
    detailedPeople = parseDetailedPeople(rawDetailedPeople).people ?? [];
  } catch (err) {
    // Non-fatal — the main analysis already succeeded and is saved below;
    // detailed per-person records are a valuable addition, not a hard
    // requirement, so a parse failure here shouldn't fail the whole run.
    console.error("Detailed people extraction failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      summary: analysis.summary,
      country: analysis.country,
      city: analysis.city,
      incident_date: analysis.incidentDate,
      category: analysis.category,
      opportunity_score: analysis.opportunityScore,
      competition_score: analysis.competitionScore,
      coverage_score: analysis.coverageScore,
      image_query: analysis.imageQuery,
      victim_demographics: analysis.victimDemographics,
      case_type_tags: analysis.caseTypeTags,
      solved_status: analysis.solvedStatus,
      case_facts: analysis.caseFacts,
      detailed_people: detailedPeople,
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

  after(async () => {
    try {
      await runBackgroundResearch(caseId, caseName, analysis.caseFacts.people ?? []);
    } catch (err) {
      console.error("Background research failed (non-fatal):", err instanceof Error ? err.message : err);
    }
    try {
      await getOrFetchYouTubeCoverage(caseId, caseName);
    } catch (err) {
      console.error("YouTube coverage fetch failed (non-fatal):", err instanceof Error ? err.message : err);
    }
  });
}