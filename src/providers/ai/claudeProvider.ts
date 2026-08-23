import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

// 8192 is the safe output ceiling without requesting any extended-output
// beta header — reliably available on every account, no special access
// needed. That's roughly 5,500-6,000 words per call, which is why
// scriptWriter.ts sizes its sections around that number rather than
// assuming a single call can produce an entire 10,000-word script.
const MAX_SAFE_OUTPUT_TOKENS = 8192;

async function callAnthropic(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("CLAUDE", async (apiKey) => {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: Math.min(options?.maxTokens ?? 1024, MAX_SAFE_OUTPUT_TOKENS),
        temperature: options?.temperature ?? 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = new Error(`Anthropic request failed: ${res.status} ${body.slice(0, 300)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");
    return text;
  });
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  isConfigured: () => hasAnyKey("CLAUDE"),

  async summarizeCase(rawText, options) {
    const prompt = `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words). Do not speculate beyond what is stated.\n\nSOURCE MATERIAL:\n${rawText}`;
    return callAnthropic(prompt, options);
  },

  async generateNarratives(caseSummary, options) {
    const prompt = `Based on this case summary, propose 5 distinct narrative/story angles a true crime YouTube creator could take, ranked by how underexplored they likely are. For each, give a one-sentence reason. Return as a numbered list only.\n\nCASE SUMMARY:\n${caseSummary}`;
    const text = await callAnthropic(prompt, options);
    return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  },

  async scoreTitle(title, context, options) {
    const prompt = `Score this YouTube title from 0-100 for a true crime channel audience, and give 2-3 short reasons for the score. Title: "${title}". ${context ? `Context: ${context}` : ""} Respond in the format "SCORE: <number>\nREASONS: <reason1>; <reason2>"`;
    const text = await callAnthropic(prompt, options);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
    };
  },

  async generateText(prompt, options) {
    return callAnthropic(prompt, options);
  },
  
};

// Backward-compatible alias — router.ts and scriptWriter.ts import this
// named export. Keeping both names avoids touching those files just for
// a rename here.
export const claudeProvider = anthropicProvider;