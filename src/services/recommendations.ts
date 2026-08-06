import type { SupabaseClient } from "@supabase/supabase-js";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import type { ChannelDNA } from "@/services/creatorDNA";
import { scoreCandidate, RECOMMENDATION_THRESHOLD, type ScoredCandidate } from "@/services/recommendationScoring";

export type TrendStatus = "for-you" | "currently-trending" | "about-to-trend";

export interface Recommendation {
  title: string;
  audienceMatch: number; // final weighted score
  reason: string;
  trendStatus: TrendStatus;
  whyRecommended: string[];
}

interface TopicExtraction {
  topics: string[];
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
      "title": string,
      "reason": string (1 sentence),
      "region": string or null (country the case occurred in, if determinable),
      "caseTypeTags": string[] (2-5 tags, e.g. "police-misconduct", "missing-person", "institutional-failure"),
      "lens": "victim-centered" | "investigative" | "systemic-failure" | "family-impact" | "courtroom" | null (best-fit narrative lens for this case),
      "audienceDnaMatch": number (0-100 — your honest judgment of how well this case fits the audience DNA profile provided, based on case-type and demographic preferences),
      "storytellingMatch": number (0-100 — how well this case suits the creator's storytelling style described below),
      "competitionScore": number (0-100 — higher = LESS existing YouTube coverage, more opportunity),
      "trendPotential": number (0-100 — current or emerging public interest level)
    }`;

function buildAudienceDnaBlock(dna?: ChannelDNA | null): string {
  if (!dna?.audienceDNA) {
    return "No Audience DNA profile available yet for this channel — score audienceDnaMatch conservatively at 50.";
  }
  const a = dna.audienceDNA;
  return `AUDIENCE DNA PROFILE:
- Preferred case types (ranked): ${a.caseTypePreferences.join(", ") || "unknown"}
- Victim demographic pattern: ethnicity=${a.victimDemographicPreferences.ethnicity ?? "no clear pattern"}, age range=${a.victimDemographicPreferences.ageRange ?? "no clear pattern"}
- Narrative style: ${a.narrativeStyle}
- Evidence emphasis: ${a.evidenceWeight.join(", ") || "unknown"}
- Content freshness preference: ${a.contentFreshness}
- Storytelling style: ${dna.channelStyle.storytellingStyle}, tone: ${dna.channelStyle.emotionalTone}`;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Every channel currently gets independently-generated recommendations with
 * zero awareness of other channels — so two channels (especially similar
 * ones) can easily get told to cover the exact same case, most often via
 * the trend batches, which run identical generic queries for everyone.
 *
 * This pulls the titles currently live in every OTHER channel's
 * recommendations column, so we can both instruct the model to avoid them
 * and hard-filter them out afterward as a safety net. Because
 * `channels.recommendations` gets fully overwritten on every regeneration
 * (not appended to), this naturally stays fresh rather than permanently
 * locking a case out forever — once another channel's batch is
 * regenerated without that case, it becomes available again.
 */
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

function buildExclusionBlock(excludedTitles: Set<string>): string {
  if (excludedTitles.size === 0) return "";
  const sample = Array.from(excludedTitles).slice(0, 40);
  return `\n\nDO NOT recommend any of these cases — they are already assigned to a different channel on this platform:\n${sample.map((t) => `- ${t}`).join("\n")}`;
}

function buildPersonalizedPrompt(
  topics: string[],
  searchContext: string,
  dna?: ChannelDNA | null,
  excludedTitles?: Set<string>
): string {
  return `You are an editorial analyst for a true crime YouTube intelligence platform. A creator's content focuses on: ${topics.join(", ")}.

${buildAudienceDnaBlock(dna)}

Based on the following search results about true crime cases matching this creator's focus, propose up to 6 candidate cases this creator could cover next.

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{ "candidates": [${CANDIDATE_SHAPE}] }

Only propose real, distinct cases that are NOT already in the creator's covered list: ${topics.join(", ")}. Score audienceDnaMatch and storytellingMatch honestly against the profile above — do not give every candidate the same scores.${buildExclusionBlock(excludedTitles ?? new Set())}`;
}

function buildTrendPrompt(
  searchContext: string,
  label: "currently-trending" | "about-to-trend",
  dna?: ChannelDNA | null,
  excludedTitles?: Set<string>
): string {
  const framing =
    label === "currently-trending"
      ? "cases that are ACTIVELY viral or breaking right now — major news coverage, high search volume this week, widely discussed"
      : "cases showing EARLY signs of rising interest — recent developments, renewed attention, or growing search/discussion volume, but not yet mainstream/saturated";

  return `You are a trend analyst for a true crime YouTube intelligence platform. Based on the search results below, identify up to 5 ${framing}.

${buildAudienceDnaBlock(dna)}

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:
{ "candidates": [${CANDIDATE_SHAPE}] }

Only include real, distinct, currently real-world cases — do not invent anything. Score audienceDnaMatch and storytellingMatch honestly against the profile above, even for trending cases outside the creator's usual coverage.${buildExclusionBlock(excludedTitles ?? new Set())}`;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function scoreAndFilter(
  candidates: ScoredCandidate[],
  dna: ChannelDNA | null | undefined,
  trendStatus: TrendStatus,
  excludedTitles: Set<string>
): Recommendation[] {
  // Safety net: drop anything matching an excluded title even if the model
  // ignored the instruction not to suggest it.
  const filtered = candidates.filter((c) => !excludedTitles.has(normalizeTitle(c.title)));

  if (!dna) {
    return filtered.map((c) => ({
      title: c.title,
      audienceMatch: 50,
      reason: c.reason,
      trendStatus,
      whyRecommended: [c.reason],
    }));
  }

  return filtered
    .map((c) => {
      const breakdown = scoreCandidate(c, dna);
      return {
        title: c.title,
        audienceMatch: breakdown.finalScore,
        reason: c.reason,
        trendStatus,
        whyRecommended: breakdown.whyRecommended,
      };
    })
    .filter((r) => r.audienceMatch >= RECOMMENDATION_THRESHOLD)
    .sort((a, b) => b.audienceMatch - a.audienceMatch);
}

async function fetchPersonalizedRecommendations(
  topics: string[],
  dna: ChannelDNA | null | undefined,
  excludedTitles: Set<string>
): Promise<Recommendation[]> {
  const searchQuery = `trending true crime cases: ${topics.slice(0, 5).join(", ")}`;
  const searchResults = await tavilyProvider.search(searchQuery, 8);
  if (searchResults.length === 0) return [];

  const searchContext = searchResults
    .map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`)
    .join("\n\n");

  const raw = await groqProvider.generateText(
    buildPersonalizedPrompt(topics, searchContext, dna, excludedTitles),
    { temperature: 0.4, maxTokens: 1400 }
  );
  const { candidates } = parseJSON<{ candidates: ScoredCandidate[] }>(raw);
  return scoreAndFilter(candidates ?? [], dna, "for-you", excludedTitles);
}

async function fetchTrendRecommendations(
  label: "currently-trending" | "about-to-trend",
  dna: ChannelDNA | null | undefined,
  excludedTitles: Set<string>
): Promise<Recommendation[]> {
  const query =
    label === "currently-trending"
      ? "breaking viral true crime news this week"
      : "true crime case renewed attention new developments emerging";

  const searchResults = await tavilyProvider.search(query, 8);
  if (searchResults.length === 0) return [];

  const searchContext = searchResults
    .map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`)
    .join("\n\n");

  const raw = await groqProvider.generateText(
    buildTrendPrompt(searchContext, label, dna, excludedTitles),
    { temperature: 0.4, maxTokens: 1400 }
  );
  const { candidates } = parseJSON<{ candidates: ScoredCandidate[] }>(raw);
  return scoreAndFilter(candidates ?? [], dna, label, excludedTitles);
}

/**
 * Computes personalized case recommendations based on the channel's
 * top-performing videos, PLUS two independent trend-signal batches not
 * gated by the channel's history. Every candidate is scored against the
 * channel's Creator DNA using the fixed weighted formula and filtered to
 * >= 80/100 before being shown.
 *
 * Takes an injected Supabase client (rather than creating its own)
 * because this runs in two different contexts: a cookie/session-based
 * client when a user manually clicks Refresh, and a service-role client
 * when the nightly cron job runs it for every channel with no user
 * session present.
 */
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

  if (topics.length === 0 && channelDNA) {
    topics = [
      ...channelDNA.channelStyle.preferredSubjects,
      ...channelDNA.channelStyle.typicalHooks,
    ];
  }

  const excludedTitles = await fetchExcludedTitles(supabase, channelId);

  const [personalized, currentlyTrending, aboutToTrend] = await Promise.all([
    topics.length > 0
      ? fetchPersonalizedRecommendations(topics, channelDNA, excludedTitles)
      : Promise.resolve([]),
    fetchTrendRecommendations("currently-trending", channelDNA, excludedTitles),
    fetchTrendRecommendations("about-to-trend", channelDNA, excludedTitles),
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