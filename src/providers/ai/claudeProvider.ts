import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Sonnet for the actual writing quality; Haiku as a fast fallback if
// Sonnet returns a rate-limit/overload error, so a transient 429/529
// doesn't fail an entire script mid-generation.
const PRIMARY_MODEL = "claude-sonnet-5";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

async function callClaudeModel(model: string, prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("CLAUDE", async (apiKey) => {
    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const error = new Error(`Claude request failed: ${res.status} ${res.statusText}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    const blocks = data.content ?? [];
    return blocks
      .filter((b: { type?: string }) => b.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("");
  });
}

async function callClaude(prompt: string, options?: AIGenerateOptions): Promise<string> {
  try {
    return await callClaudeModel(PRIMARY_MODEL, prompt, options);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    // 429 = rate limited, 529 = Anthropic-specific "overloaded", 5xx = server issue.
    const isRateLimitOrServerIssue = status === 429 || status === 529 || (typeof status === "number" && status >= 500);
    if (!isRateLimitOrServerIssue) {
      throw err;
    }
    console.warn(`[claude] ${PRIMARY_MODEL} hit a transient error (status ${status}) — falling back to ${FALLBACK_MODEL} for this request.`);
    return await callClaudeModel(FALLBACK_MODEL, prompt, options);
  }
}

export const claudeProvider: AIProvider = {
  name: "claude",
  isConfigured: () => hasAnyKey("CLAUDE"),

  async summarizeCase(rawText, options) {
    const prompt = `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words). Do not speculate beyond what is stated. Write like an investigative briefing, not a Wikipedia article.\n\nSOURCE MATERIAL:\n${rawText}`;
    return callClaude(prompt, options);
  },

  async generateNarratives(caseSummary, options) {
    const prompt = `Based on this case summary, propose 5 distinct narrative/story angles a true crime YouTube creator could take, ranked by how underexplored they likely are. For each, give a one-sentence reason. Return as a numbered list only.\n\nCASE SUMMARY:\n${caseSummary}`;
    const text = await callClaude(prompt, options);
    return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  },

  async scoreTitle(title, context, options) {
    const prompt = `Score this YouTube title from 0-100 for a true crime channel audience, and give 2-3 short reasons for the score. Title: "${title}". ${context ? `Context: ${context}` : ""} Respond in the format "SCORE: <number>\nREASONS: <reason1>; <reason2>"`;
    const text = await callClaude(prompt, options);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
    };
  },

  async generateText(prompt, options) {
    return callClaude(prompt, options);
  },
};