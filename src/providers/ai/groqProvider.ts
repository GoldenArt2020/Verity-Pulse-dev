import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_EMPTY_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqOnce(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("GROQ", async (apiKey) => {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 1024,
        reasoning_effort: "low",
      }),
    });

    if (!res.ok) {
      const error = new Error(`Groq request failed: ${res.status} ${res.statusText}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  });
}

/**
 * openai/gpt-oss-120b is a reasoning model that, per Groq's own community
 * forum reports, sometimes burns its response on hidden reasoning and
 * returns empty visible content — reported as happening on a meaningful
 * fraction of requests even with reasoning_effort tuned down. Since this
 * is a known upstream quirk rather than something our request shape
 * controls, retry automatically on an empty response before giving up,
 * rather than letting every caller's JSON.parse crash on "".
 */
async function callGroq(prompt: string, options?: AIGenerateOptions): Promise<string> {
  let lastResult = "";
  for (let attempt = 0; attempt <= MAX_EMPTY_RETRIES; attempt++) {
    lastResult = await callGroqOnce(prompt, options);
    if (lastResult.trim().length > 0) {
      return lastResult;
    }
    if (attempt < MAX_EMPTY_RETRIES) {
      console.warn(`[groqProvider] Empty response on attempt ${attempt + 1}, retrying...`);
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error("Groq returned an empty response after retries");
}

export const groqProvider: AIProvider = {
  name: "groq",
  isConfigured: () => hasAnyKey("GROQ"),

  async summarizeCase(rawText, options) {
    const prompt = `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words). Do not speculate beyond what is stated. Write like an investigative briefing, not a Wikipedia article.\n\nSOURCE MATERIAL:\n${rawText}`;
    return callGroq(prompt, options);
  },

  async generateNarratives(caseSummary, options) {
    const prompt = `Based on this case summary, propose 5 distinct narrative/story angles a true crime YouTube creator could take, ranked by how underexplored they likely are. For each, give a one-sentence reason. Return as a numbered list only.\n\nCASE SUMMARY:\n${caseSummary}`;
    const text = await callGroq(prompt, options);
    return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  },

  async scoreTitle(title, context, options) {
    const prompt = `Score this YouTube title from 0-100 for a true crime channel audience, and give 2-3 short reasons for the score. Title: "${title}". ${context ? `Context: ${context}` : ""} Respond in the format "SCORE: <number>\nREASONS: <reason1>; <reason2>"`;
    const text = await callGroq(prompt, options);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
    };
  },

  async generateText(prompt, options) {
    return callGroq(prompt, options);
  },
};