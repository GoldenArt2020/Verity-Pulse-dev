import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

// Free tier, no credit card required — get a key at aistudio.google.com.
// ~1,500 requests/day on Flash as of mid-2026, more than enough for
// script generation's per-request pattern.
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("GEMINI", async (apiKey) => {
    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!res.ok) {
      const error = new Error(`Gemini request failed: ${res.status} ${res.statusText}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    // Gemini nests text under candidates[0].content.parts[].text — join
    // every part in case the response is split across multiple.
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? "").join("");
  });
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  isConfigured: () => hasAnyKey("GEMINI"),

  async summarizeCase(rawText, options) {
    const prompt = `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words). Do not speculate beyond what is stated. Write like an investigative briefing, not a Wikipedia article.\n\nSOURCE MATERIAL:\n${rawText}`;
    return callGemini(prompt, options);
  },

  async generateNarratives(caseSummary, options) {
    const prompt = `Based on this case summary, propose 5 distinct narrative/story angles a true crime YouTube creator could take, ranked by how underexplored they likely are. For each, give a one-sentence reason. Return as a numbered list only.\n\nCASE SUMMARY:\n${caseSummary}`;
    const text = await callGemini(prompt, options);
    return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  },

  async scoreTitle(title, context, options) {
    const prompt = `Score this YouTube title from 0-100 for a true crime channel audience, and give 2-3 short reasons for the score. Title: "${title}". ${context ? `Context: ${context}` : ""} Respond in the format "SCORE: <number>\nREASONS: <reason1>; <reason2>"`;
    const text = await callGemini(prompt, options);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
    };
  },

  async generateText(prompt, options) {
    return callGemini(prompt, options);
  },
};