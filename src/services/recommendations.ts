import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";

export interface Recommendation {
  title: string;
  audienceMatch: number;
  reason: string;
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

function buildRecommendationPrompt(topics: string[], searchContext: string): string {
  return `You are an editorial analyst for a true crime YouTube intelligence platform. A creator's top-performing videos covered these cases: ${topics.join(", ")}.

Based on the following search results about SIMILAR but DIFFERENT true crime cases (not the ones already covered), recommend up to 5 cases this creator should cover next.

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

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Computes personalized case recommendations based on the channel's
 * top-performing videos. Two Groq calls total (topic extraction, then
 * recommendation writing) + one Tavily search — NOT per-video.
 * Called server-side only (from /api/channel/connect and the refresh
 * route), never directly from the browser.
 */
export async function generateRecommendations(
  channelId: string,
  videos: YouTubeVideoDetail[]
): Promise<Recommendation[]> {
  console.log("DEBUG videos.length:", videos.length);

  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured — cannot generate recommendations");
  }
  if (!tavilyProvider.isConfigured()) {
    throw new Error("Tavily is not configured — cannot generate recommendations");
  }
  if (videos.length === 0) {
    console.log("DEBUG: returning early, videos.length === 0");
    return [];
  }

  const topicRaw = await groqProvider.generateText(buildTopicExtractionPrompt(videos), {
    temperature: 0.2,
    maxTokens: 400,
  });
  console.log("DEBUG topicRaw:", topicRaw);

  const { topics } = parseJSON<TopicExtraction>(topicRaw);
  console.log("DEBUG topics:", topics);

  if (topics.length === 0) {
    console.log("DEBUG: returning early, topics.length === 0");
    return [];
  }

  const searchQuery = `true crime cases similar to ${topics.slice(0, 5).join(", ")}`;
  const searchResults = await tavilyProvider.search(searchQuery, 8);
  console.log("DEBUG searchResults.length:", searchResults.length);

  if (searchResults.length === 0) {
    console.log("DEBUG: returning early, searchResults.length === 0");
    return [];
  }

  const searchContext = searchResults
    .map((r, i) => `${i + 1}. [${r.title}]\n${r.snippet}`)
    .join("\n\n");

  const recRaw = await groqProvider.generateText(buildRecommendationPrompt(topics, searchContext), {
    temperature: 0.4,
    maxTokens: 800,
  });
  console.log("DEBUG recRaw:", recRaw);

  const { recommendations } = parseJSON<{ recommendations: Recommendation[] }>(recRaw);
  console.log("DEBUG final recommendations:", recommendations);

  const supabase = await createClient();
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