// src/services/recommendations.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import type { ChannelDNA } from "@/services/creatorDNA";

export type TrendStatus = "for-you" | "currently-trending" | "about-to-trend";

export interface Recommendation {
  title: string;
  audienceMatch: number;
  reason: string;
  trendStatus: TrendStatus;
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

function buildPersonalizedPrompt(topics: string[], searchContext: string): string {
  return `You are an editorial analyst for a true crime YouTube intelligence platform. A creator's content focuses on: ${topics.join(", ")}.

Based on the following search results about true crime cases matching this creator's focus, recommend up to 5 cases this creator should cover next.

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{
  "recommendations": [
    { "title": string, "audienceMatch": number (0-100), "reason": string (1 sentence, tie it back to why it matches this creator's proven audience) }
  ]
}

Only recommend real, distinct cases that are NOT already in the creator's covered list: ${topics.join(", ")}.`;
}

function buildTrendPrompt(searchContext: string, label: "currently-trending" | "about-to-trend"): string {
  const framing =
    label === "currently-trending"
      ? "cases that are ACTIVELY viral or breaking right now — major news coverage, high search volume this week, widely discussed, AND (if YouTube data is provided below) genuinely high recent view counts on the platform"
      : "cases showing EARLY signs of rising interest — recent developments, renewed attention, or growing search/discussion volume, but not yet mainstream/saturated on YouTube";

  return `You are a trend analyst for a true crime YouTube intelligence platform. Based on the search results below, identify up to 4 ${framing}.

SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{
  "recommendations": [
    { "title": string, "audienceMatch": number (0-100, general true-crime audience interest level), "reason": string (1 sentence explaining the trend signal — why this is ${label === "currently-trending" ? "trending now" : "about to trend"}) }
  ]
}

Only include real, distinct, currently real-world cases — do not invent anything.`;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function fetchTrendRecommendations(
  label: "currently-trending" | "about-to-trend"
): Promise<Recommendation[]> {
  const query =
    label === "currently-trending"
      ? "breaking viral true crime news this week"
      : "true crime case renewed attention new developments emerging";

  const [searchResults, youtubeSignal] = await Promise.all([
    tavilyProvider.search(query, 8),
    label === "currently-trending" && youtubeProvider.isConfigured()
      ? youtubeProvider.searchTrendingVideos("true crime case", 7, 12).catch(() => [])
      : Promise.resolve([]),
  ]);

  if (searchResults.length === 0 && youtubeSignal.length === 0) return [];

  const searchContext = searchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");

  const youtubeContext =
    youtubeSignal.length > 0
      ? `\n\nRECENT HIGH-VIEW YOUTUBE VIDEOS ON TRUE CRIME (last 7 days, sorted by views — real signal of what's resonating on the platform right now):\n${youtubeSignal
          .map((v, i) => `${i + 1}. "${v.title}" (published ${v.publishedAt})`)
          .join("\n")}`
      : "";

  const raw = await groqProvider.generateText(buildTrendPrompt(searchContext + youtubeContext, label), {
    temperature: 0.4,
    maxTokens: 600,
  });

  const { recommendations } = parseJSON<{ recommendations: Omit<Recommendation, "trendStatus">[] }>(raw);
  return recommendations.map((r) => ({ ...r, trendStatus: label }));
}

async function fetchPersonalizedRecommendations(topics: string[]): Promise<Recommendation[]> {
  const searchQuery = `trending true crime cases: ${topics.slice(0, 5).join(", ")}`;
  const searchResults = await tavilyProvider.search(searchQuery, 8);
  if (searchResults.length === 0) return [];

  const searchContext = searchResults.map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`).join("\n\n");

  const raw = await groqProvider.generateText(buildPersonalizedPrompt(topics, searchContext), {
    temperature: 0.4,
    maxTokens: 800,
  });
  const { recommendations } = parseJSON<{ recommendations: Omit<Recommendation, "trendStatus">[] }>(raw);
  return recommendations.map((r) => ({ ...r, trendStatus: "for-you" as const }));
}

/**
 * Computes personalized case recommendations based on the channel's
 * top-performing videos, PLUS two independent trend-signal batches that
 * are NOT gated by the channel's history — "Currently Trending" (breaking
 * now) and "About to Trend" (early rising signal) — so genuinely new
 * cases outside a creator's past coverage can still surface.
 *
 * Accepts an already-constructed Supabase client so callers control
 * which client is used (cookie-based for user-triggered requests,
 * service-role for cron jobs with no user session). The `any, any, any`
 * generic params avoid type friction between the two client variants.
 */
export async function generateRecommendations(
  supabase: SupabaseClient<any, any, any>,
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

  const [personalized, currentlyTrending, aboutToTrend] = await Promise.all([
    topics.length > 0 ? fetchPersonalizedRecommendations(topics) : Promise.resolve([]),
    fetchTrendRecommendations("currently-trending"),
    fetchTrendRecommendations("about-to-trend"),
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