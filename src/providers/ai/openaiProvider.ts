import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4.1";

async function callOpenAI(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("OPENAI", async (apiKey) => {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = new Error(`OpenAI request failed: ${res.status} ${text.slice(0, 300)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("OpenAI response missing message content.");
    return content;
  });
}

export const openaiProvider: AIProvider = {
  name: "openai",
  isConfigured: () => hasAnyKey("OPENAI"),
  async summarizeCase(rawText, options) {
    return callOpenAI(`Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words).\n\n${rawText}`, options);
  },
  async generateNarratives(caseSummary, options) {
    const text = await callOpenAI(`Propose 5 distinct narrative angles for this case, ranked by underexplored-ness. Numbered list only.\n\n${caseSummary}`, options);
    return text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  },
  async scoreTitle(title, context, options) {
    const text = await callOpenAI(`Score this YouTube title 0-100. Title: "${title}". ${context ?? ""} Format: "SCORE: <n>\nREASONS: <r1>; <r2>"`, options);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
    };
  },
  async generateText(prompt, options) {
    return callOpenAI(prompt, options);
  },
};