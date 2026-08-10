import type { SupabaseClient } from "@supabase/supabase-js";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import type { ChannelDNA } from "@/services/creatorDNA";
import { scoreCandidate, RECOMMENDATION_THRESHOLD, type ScoredCandidate, type ScoreBreakdown } from "@/services/recommendationScoring";
import { CASE_TYPE_TAG_LIST_TEXT } from "@/lib/caseTypeTaxonomy";
import { deriveChannelSubniche } from "@/lib/channelSubniche";

export type TrendStatus = "for-you" | "currently-trending" | "about-to-trend";

export interface Recommendation {
  title: string;
  audienceMatch: number;
  reason: string;
  trendStatus: TrendStatus;
  whyRecommended: string[];
  displayRegion: string | null;
  isRegionException: boolean;
  viralityScore: number;
  viralityReason: string;
  bestAngle: string;
  thumbnailConcept: string;
  openingHook: string;
  breakdown: {
    creatorDnaMatch: number;
    audienceInterest: number;
    searchOpportunity: number;
    competition: number;
    untappedAngles: number;
    regionalMatch: number;
    newsMomentum: number;
    historicalPerformance: number;
    viralityScore: number;
  };
}

interface TopicExtraction {
  topics: string[];
}

interface ClaimedAssignment {
  channelIds: Set<string>;
  subniches: Set<string>;
}

function buildTopicExtractionPrompt(videos: YouTubeVideoDetail[]): string {
  const topVideos = [...videos]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 15)
    .map((v, i) => `${i + 1}. "${v.title}" — ${v.viewCount} views`)
    .join("\n");

  return `You are an editorial analyst for a true crime YouTube channel. Below are the channel's top-performing videos by view count. Identify the specific real-world true crime CASE, PERSON, or INCIDENT each video is actually about (not the general topic — the specific case name if identifiable).

TOP VIDEOS:
${topVideos}

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{ "topics": string[] }

List the distinct real case/person names you can confidently identify (max 10). If a video's subject can't be confidently identified as a specific real case, skip it rather than guessing.`;
}

const CANDIDATE_SHAPE = `{
      "title": string (the case's FULL identifying name — a complete victim/subject name and/or descriptive case title, e.g. "The Murder of Jane Smith" or "Jane Smith Disappearance Case". NEVER a bare first name or fragment alone (e.g. never just "Jane"). If you cannot confidently identify a complete, specific real case this way, do not include it as a candidate at all — skip it rather than guess.),
      "reason": string (1 sentence),
      "region": string or null (country the case occurred in, if determinable),
      "caseTypeTags": string[] (2-4 tags describing what kind of case this is — choose ONLY from this exact list so it can be matched against the channel's proven history: ${CASE_TYPE_TAG_LIST_TEXT}),
      "lens": "victim-centered" | "investigative" | "systemic-failure" | "family-impact" | "courtroom" | null (best-fit narrative lens for this case),
      "creatorDnaMatch": number (0-100 — how closely this case matches THIS channel's proven content style, subject matter, and tone, based on the profile below),
      "audienceInterest": number (0-100 — predicted general audience engagement for this case, based on how it compares to similar well-performing true crime content),
      "searchOpportunity": number (0-100 — current search/Google Trends/YouTube search demand for this case),
      "competitionScore": number (0-100 — higher = LESS existing YouTube coverage, more opportunity),
      "untappedAnglesScore": number (0-100 — how many genuinely fresh, unexplored storytelling angles this case likely has, based on what's typically covered for cases like this),
      "newsMomentum": number (0-100 — whether this case is currently developing, breaking, or receiving renewed attention right now; 0 if it's a static/settled older case),
      "viralityScore": number (0-100 — the CASE VIRALITY SCORE, computed using this exact weighted rubric: strong mystery/unanswered questions=20pts, emotional/relatable victim story=15pts, shocking twist or contradiction=15pts, recent development reviving the case=15pts, compelling suspect relationship/betrayal angle=10pts, strong evidence such as CCTV/DNA/documents=10pts, potential for public debate/differing interpretations=5pts, current search interest=5pts, strong thumbnail/curiosity-gap potential=5pts. Sum the factors that genuinely apply to this real case — do not inflate. Below 55 means skip unless there's a special angle.),
      "viralityReason": string (1 short sentence citing the 2-4 specific virality factors that drove the score, e.g. "New court development + relatable victim + conflicting timeline + unexpected suspect"),
      "bestAngle": string (the single best storytelling angle for this case, framed as a specific unanswered question or narrative thread — not just a restatement of the case name),
      "thumbnailConcept": string (a short, concrete thumbnail concept — what should be shown/juxtaposed to create a curiosity gap),
      "openingHook": string (a single compelling opening line for the video script, promising a story/question rather than just naming the case)
    }`;

function buildAudienceDnaBlock(dna?: ChannelDNA | null): string {
  if (!dna?.audienceDNA) {
    return "No Creator DNA profile available yet for this channel — score creatorDnaMatch and audienceInterest conservatively at 50.";
  }
  const a = dna.audienceDNA;
  return `CREATOR DNA PROFILE:
- Preferred case types (ranked): ${a.caseTypePreferences.join(", ") || "unknown"}
- Victim demographic pattern: ethnicity=${a.victimDemographicPreferences.ethnicity ?? "no clear pattern"}, age range=${a.victimDemographicPreferences.ageRange ?? "no clear pattern"}
- Narrative style: ${a.narrativeStyle}
- Evidence emphasis: ${a.evidenceWeight.join(", ") || "unknown"}
- Content freshness preference: ${a.contentFreshness}${
    dna.channelStyle
      ? `\n- Storytelling style: ${dna.channelStyle.storytellingStyle}, tone: ${dna.channelStyle.emotionalTone}`
      : ""
  }`;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchExcludedTitles(
  supabase: SupabaseClient,
  currentChannelId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("channels")
    .select("recommendations")
    .neq("id", currentChannelId);

  if (error || !data) return new Set();

  const excluded = new Set<string>();
  for (const row of data) {
    const recs = (row.recommendations as Recommendation[] | null) ?? [];
    for (const r of recs) {
      if (r?.title) excluded.add(normalizeTitle(r.title));
    }
  }
  return excluded;
}

async function fetchClaimedAssignments(
  supabase: SupabaseClient,
  currentChannelId: string
): Promise<Map<string, ClaimedAssignment>> {
  const { data, error } = await supabase
    .from("cases")
    .select("name, channel_id, channels(channel_dna)")
    .not("channel_id", "is", null)
    .neq("channel_id", currentChannelId);

  if (error || !data) return new Map();

  const map = new Map<string, ClaimedAssignment>();
  for (const row of data as unknown as { name: string; channel_id: string; channels: { channel_dna: unknown } | null }[]) {
    if (!row.name || !row.channel_id) continue;
    const key = normalizeTitle(row.name);
    const subniche = deriveChannelSubniche(row.channels?.channel_dna as ChannelDNA | null);
    const entry = map.get(key) ?? { channelIds: new Set<string>(), subniches: new Set<string>() };
    entry.channelIds.add(row.channel_id);
    entry.subniches.add(subniche);
    map.set(key, entry);
  }
  return map;
}

function isBlockedByAssignment(
  title: string,
  assignments: Map<string, ClaimedAssignment>,
  currentSubniche: string
): boolean {
  const entry = assignments.get(normalizeTitle(title));
  if (!entry) return false;
  if (entry.channelIds.size >= 2) return true;
  if (entry.subniches.has(currentSubniche)) return true;
  return false;
}

function assignmentExclusionSample(
  assignments: Map<string, ClaimedAssignment>,
  currentSubniche: string
): Set<string> {
  const set = new Set<string>();
  for (const [title, entry] of assignments) {
    if (entry.channelIds.size >= 2 || entry.subniches.has(currentSubniche)) {
      set.add(title);
    }
  }
  return set;
}

function buildExclusionBlock(excludedTitles: Set<string>): string {
  if (excludedTitles.size === 0) return "";
  const sample = Array.from(excludedTitles).slice(0, 40);
  return `\n\nDO NOT recommend any of these cases — they are already assigned to a different channel on this platform:\n${sample.map((t) => `- ${t}`).join("\n")}`;
}

const VIRALITY_RUBRIC = `CASE VIRALITY RUBRIC (use this to score viralityScore honestly for every candidate):
A true-crime case goes viral when it has a strong emotional hook + unanswered questions + a compelling human story + new developments people want to discuss. Score out of 100 using these weighted factors:
- Strong mystery / unanswered questions (20pts): missing person, locked-room mystery, conflicting witness accounts, evidence that doesn't fit the official story.
- Emotional, relatable victim story (15pts): viewers feel immediately connected — not about age, about relatability.
- Shocking twist or contradiction (15pts): "everyone believed X, then evidence revealed Y."
- Recent development reviving the case (15pts): arrest, trial, sentencing, new DNA/evidence, new witness, confession, cold-case breakthrough, family speaking publicly.
- Compelling suspect relationship / betrayal angle (10pts): trusted person turning out to be the suspect is far more compelling than a stranger.
- Strong evidence available (10pts): CCTV, DNA, documents, surveillance footage, court filings.
- Potential for public debate (5pts): reasonable viewers could interpret the evidence differently.
- Current search interest (5pts).
- Strong thumbnail/curiosity-gap potential (5pts): the story promises a specific unanswered question, not just a case name.
Do not manufacture facts to inflate any factor — only score what's genuinely supported by the case as reported.`;

function buildPersonalizedPrompt(
  topics: string[],
  searchContext: string,
  dna?: ChannelDNA | null,
  excludedTitles?: Set<string>
): string {
  return `You are an editorial analyst for a true crime YouTube intelligence platform. A creator's content focuses on: ${topics.join(", ")}.

${buildAudienceDnaBlock(dna)}

${VIRALITY_RUBRIC}

Based on the following search results about true crime cases matching this creator's focus, propose up to 6 candidate cases this creator could cover next.

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{ "candidates": [${CANDIDATE_SHAPE}] }

Only propose real, distinct cases that are NOT already in the creator's covered list: ${topics.join(", ")}. Score every field honestly and distinctly — do not give every candidate the same scores.${buildExclusionBlock(excludedTitles ?? new Set())}`;
}

const ABOUT_TO_TREND_WINDOW_DAYS = 20;

function buildTrendPrompt(
  searchContext: string,
  label: "currently-trending" | "about-to-trend",
  dna?: ChannelDNA | null,
  excludedTitles?: Set<string>
): string {
  const framing =
    label === "currently-trending"
      ? "cases that are ACTIVELY viral or breaking right now — major news coverage, high search volume this week, widely discussed"
      : `cases showing EARLY signs of rising interest, where the underlying development (arrest, new evidence, renewed coverage, family statement, court filing, etc.) happened within the last ${ABOUT_TO_TREND_WINDOW_DAYS} days — check each result's "published" date; if you cannot confirm the development falls inside that window, DO NOT include the case no matter how compelling it looks`;

  return `You are a trend analyst for a true crime YouTube intelligence platform. Based on the search results below, identify up to 5 ${framing}.

${buildAudienceDnaBlock(dna)}

${VIRALITY_RUBRIC}

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{ "candidates": [${CANDIDATE_SHAPE}] }

Only include real, distinct, currently real-world cases — do not invent anything. Score creatorDnaMatch and audienceInterest honestly against the profile above, even for trending cases outside the creator's usual coverage.${buildExclusionBlock(excludedTitles ?? new Set())}`;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function toRecommendation(
  candidate: ScoredCandidate,
  breakdown: ScoreBreakdown,
  trendStatus: TrendStatus
): Recommendation {
  return {
    title: candidate.title,
    audienceMatch: breakdown.finalScore,
    reason: candidate.reason,
    trendStatus,
    whyRecommended: breakdown.whyRecommended,
    displayRegion: breakdown.displayRegion,
    isRegionException: breakdown.isRegionException,
    viralityScore: candidate.viralityScore,
    viralityReason: candidate.viralityReason,
    bestAngle: candidate.bestAngle,
    thumbnailConcept: candidate.thumbnailConcept,
    openingHook: candidate.openingHook,
    breakdown: {
      creatorDnaMatch: breakdown.creatorDnaMatch,
      audienceInterest: breakdown.audienceInterest,
      searchOpportunity: breakdown.searchOpportunity,
      competition: breakdown.competition,
      untappedAngles: breakdown.untappedAngles,
      regionalMatch: breakdown.regionalMatch,
      newsMomentum: breakdown.newsMomentum,
      historicalPerformance: breakdown.historicalPerformance,
      viralityScore: breakdown.viralityScore,
    },
  };
}

function scoreAndFilter(
  candidates: ScoredCandidate[],
  dna: ChannelDNA | null | undefined,
  trendStatus: TrendStatus,
  excludedTitles: Set<string>,
  assignments: Map<string, ClaimedAssignment>,
  currentSubniche: string
): Recommendation[] {
  const filtered = candidates.filter(
    (c) =>
      !excludedTitles.has(normalizeTitle(c.title)) &&
      !isBlockedByAssignment(c.title, assignments, currentSubniche)
  );

  if (!dna) {
    return filtered.map((c) => ({
      title: c.title,
      audienceMatch: 50,
      reason: c.reason,
      trendStatus,
      whyRecommended: [c.reason],
      displayRegion: c.region,
      isRegionException: false,
      viralityScore: c.viralityScore,
      viralityReason: c.viralityReason,
      bestAngle: c.bestAngle,
      thumbnailConcept: c.thumbnailConcept,
      openingHook: c.openingHook,
      breakdown: {
        creatorDnaMatch: 50,
        audienceInterest: 50,
        searchOpportunity: 50,
        competition: 50,
        untappedAngles: 50,
        regionalMatch: 50,
        newsMomentum: 50,
        historicalPerformance: 50,
        viralityScore: c.viralityScore,
      },
    }));
  }

  return filtered
    .map((c) => toRecommendation(c, scoreCandidate(c, dna), trendStatus))
    .filter((r) => r.audienceMatch >= RECOMMENDATION_THRESHOLD)
    .sort((a, b) => b.audienceMatch - a.audienceMatch);
}

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/$/, "");
}

const MAX_SNIPPET_CHARS = 500;

function formatSearchContext(results: { title: string; snippet: string; publishedDate?: string }[]): string {
  return results
    .map((r, i) => {
      const snippet =
        r.snippet.length > MAX_SNIPPET_CHARS ? `${r.snippet.slice(0, MAX_SNIPPET_CHARS)}…` : r.snippet;
      return `${i + 1}. [${r.title}] (published: ${r.publishedDate ?? "unknown"})\n${snippet}`;
    })
    .join("\n\n");
}

function isWithinRecencyWindow(publishedDate: string | undefined, days: number): boolean {
  if (!publishedDate) return false;
  const parsed = Date.parse(publishedDate);
  if (Number.isNaN(parsed)) return false;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  return parsed >= cutoffMs;
}

async function fetchMultiQuery(
  queries: string[],
  maxResultsEach: number,
  options?: Parameters<typeof tavilyProvider.search>[2],
  cap = 16
) {
  const batches = await Promise.all(
    queries.map((q) => tavilyProvider.search(q, maxResultsEach, options).catch(() => []))
  );
  const seen = new Set<string>();
  const merged = [];
  for (const batch of batches) {
    for (const r of batch) {
      const key = normalizeUrl(r.url);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
  }
  return merged.slice(0, cap);
}

const CURRENTLY_TRENDING_QUERIES = [
  "breaking true crime case news",
  "missing person case investigation update",
  "murder trial verdict sentencing news",
  "cold case new evidence arrest",
  "wrongful conviction appeal overturned",
];

const ABOUT_TO_TREND_QUERIES = [
  "cold case breakthrough renewed investigation",
  "true crime new witness confession",
  "court filing unsealed case development",
  "true crime family speaks out case",
  "unsolved case DNA match identified",
];

async function fetchPersonalizedRecommendations(
  topics: string[],
  dna: ChannelDNA | null | undefined,
  excludedTitles: Set<string>,
  assignments: Map<string, ClaimedAssignment>,
  currentSubniche: string
): Promise<Recommendation[]> {
  const topicsJoined = topics.slice(0, 5).join(", ");
  const queries = [
    `trending true crime cases: ${topicsJoined}`,
    `${topicsJoined} unsolved mystery missing person`,
    `${topicsJoined} betrayal suspect secret relationship`,
  ];
  const searchResults = await fetchMultiQuery(queries, 6);
  if (searchResults.length === 0) return [];

  const searchContext = formatSearchContext(searchResults);

  const raw = await groqProvider.generateText(
    buildPersonalizedPrompt(topics, searchContext, dna, excludedTitles),
    { temperature: 0.4, maxTokens: 2600 }
  );
  const { candidates } = parseJSON<{ candidates: ScoredCandidate[] }>(raw);
  return scoreAndFilter(candidates ?? [], dna, "for-you", excludedTitles, assignments, currentSubniche);
}

async function fetchTrendRecommendations(
  label: "currently-trending" | "about-to-trend",
  dna: ChannelDNA | null | undefined,
  excludedTitles: Set<string>,
  assignments: Map<string, ClaimedAssignment>,
  currentSubniche: string
): Promise<Recommendation[]> {
  const queries = label === "currently-trending" ? CURRENTLY_TRENDING_QUERIES : ABOUT_TO_TREND_QUERIES;

  const searchResults = await fetchMultiQuery(queries, 5, {
    topic: "news",
    days: label === "currently-trending" ? 7 : ABOUT_TO_TREND_WINDOW_DAYS,
  });
  if (searchResults.length === 0) return [];

  const usableResults =
    label === "about-to-trend"
      ? searchResults.filter((r) => isWithinRecencyWindow(r.publishedDate, ABOUT_TO_TREND_WINDOW_DAYS))
      : searchResults;
  if (usableResults.length === 0) return [];

  const searchContext = formatSearchContext(usableResults);

  const raw = await groqProvider.generateText(
    buildTrendPrompt(searchContext, label, dna, excludedTitles),
    { temperature: 0.4, maxTokens: 2600 }
  );
  const { candidates } = parseJSON<{ candidates: ScoredCandidate[] }>(raw);
  return scoreAndFilter(candidates ?? [], dna, label, excludedTitles, assignments, currentSubniche);
}

export async function generateRecommendations(
  supabase: SupabaseClient,
  channelId: string,
  videos: YouTubeVideoDetail[],
  channelDNA?: ChannelDNA | null
): Promise<Recommendation[]> {
  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate recommendations");
  }
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot generate recommendations");
  }

  let topics: string[] = [];

  if (videos.length > 0) {
    const topicRaw = await groqProvider.generateText(buildTopicExtractionPrompt(videos), {
      temperature: 0.2,
      maxTokens: 400,
    });
    const parsed = parseJSON<TopicExtraction>(topicRaw);
    topics = parsed.topics;
  }

  if (topics.length === 0 && channelDNA?.channelStyle) {
    topics = [
      ...(channelDNA.channelStyle.preferredSubjects ?? []),
      ...(channelDNA.channelStyle.typicalHooks ?? []),
    ];
  }

  const currentSubniche = deriveChannelSubniche(channelDNA);

  const [liveExcludedTitles, assignments] = await Promise.all([
    fetchExcludedTitles(supabase, channelId),
    fetchClaimedAssignments(supabase, channelId),
  ]);

  const excludedTitles = new Set([
    ...liveExcludedTitles,
    ...assignmentExclusionSample(assignments, currentSubniche),
  ]);

  const [personalized, currentlyTrending, aboutToTrend] = await Promise.all([
    topics.length > 0
      ? fetchPersonalizedRecommendations(topics, channelDNA, excludedTitles, assignments, currentSubniche)
      : Promise.resolve([]),
    fetchTrendRecommendations("currently-trending", channelDNA, excludedTitles, assignments, currentSubniche),
    fetchTrendRecommendations("about-to-trend", channelDNA, excludedTitles, assignments, currentSubniche),
  ]);

  const recommendations = [...personalized, ...currentlyTrending, ...aboutToTrend];

  const { error } = await supabase
    .from("channels")
    .update({
      recommendations,
      recommendations_generated_at: new Date().toISOString(),
    })
    .eq("id", channelId);

  if (error) {
    throw new Error(`Failed to save recommendations: ${error.message}`);
  }

  return recommendations;
}