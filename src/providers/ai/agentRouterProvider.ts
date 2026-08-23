import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const AGENTROUTER_URL = "https://agentrouter.org/v1/chat/completions";

async function callAgentRouter(model: string, prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("AGENTROUTER", async (apiKey) => {
    const res = await fetch(AGENTROUTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });
    const bodyText = await res.text();

    if (!res.ok || /^\s*<!doctype|^\s*<html/i.test(bodyText)) {
      const error = new Error(
        `AgentRouter blocked or rejected this request (status ${res.status}) — looks like a WAF/challenge page, not the API: ${bodyText.slice(0, 200)}`
      ) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = JSON.parse(bodyText);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("AgentRouter response missing message content.");
    }
    return content;
  });
}

function makeAgentRouterProvider(name: string, model: string): AIProvider {
  return {
    name,
    isConfigured: () => hasAnyKey("AGENTROUTER"),
    async summarizeCase(rawText, options) {
      return callAgentRouter(model, `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words).\n\n${rawText}`, options);
    },
    async generateNarratives(caseSummary, options) {
      const text = await callAgentRouter(model, `Propose 5 distinct narrative angles for this case, ranked by underexplored-ness. Numbered list only.\n\n${caseSummary}`, options);
      return text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    },
    async scoreTitle(title, context, options) {
      const text = await callAgentRouter(model, `Score this YouTube title 0-100. Title: "${title}". ${context ?? ""} Format: "SCORE: <n>\nREASONS: <r1>; <r2>"`, options);
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
      const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
      return {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
        reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
      };
    },
    async generateText(prompt, options) {
      return callAgentRouter(model, prompt, options);
    },
  };
}

// Fast/structured calls — angle generation, recommendations, research JSON.
export const agentRouterFastProvider = makeAgentRouterProvider("agentrouter-fast", "gpt-5.6-sol");

// Script prose writing.
export const agentRouterWriteProvider = makeAgentRouterProvider("agentrouter-write", "claude-opus-5");