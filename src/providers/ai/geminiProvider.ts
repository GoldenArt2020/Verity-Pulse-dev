import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

// Gemini 2.5 Pro is the primary model for quality. Its free tier is tight
// (~5 RPM, ~25-100 RPD depending on account) — key rotation across
// GEMINI_API_KEY_1/_2/_3... multiplies that ceiling, but a long
// multi-section script can still exhaust every rotating Pro key in one
// run. Rather than hard-failing when that happens, every call falls back
// to 2.5 Flash (same API keys, much higher quota) ONLY once the full Pro
// rotation is exhausted — so Pro is still used for everything by default,
// Flash only ever fires as a safety net, and the user sees a completed
// result instead of a 429 error.
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";

function urlFor(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGeminiModel(model: string, prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("GEMINI", async (apiKey) => {
    const res = await fetch(urlFor(model), {
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
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? "").join("");
  });
}

async function callGemini(prompt: string, options?: AIGenerateOptions): Promise<string> {
  try {
    return await callGeminiModel(PRIMARY_MODEL, prompt, options);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const isQuotaOrServerIssue = status === 429 || status === 401 || (typeof status === "number" && status >= 500);
    if (!isQuotaOrServerIssue) {
      throw err;
    }
    console.warn(`[gemini] ${PRIMARY_MODEL} exhausted across all rotating keys (status ${status}) — falling back to ${FALLBACK_MODEL} for this request.`);
    return await callGeminiModel(FALLBACK_MODEL, prompt, options);
  }
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