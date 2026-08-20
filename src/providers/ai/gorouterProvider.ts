import axios from "axios";
import type { AIProvider, AIGenerateOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

// GoRouter (https://gorouter.app) is a third-party, OpenAI-compatible AI
// API gateway billed against a prepaid wallet balance. It is NOT an
// official Anthropic/OpenAI/Google partner — it's a small third-party
// gateway/reseller (built on the open-source "New API" project) that
// proxies requests to underlying model providers and debits your GoRouter
// wallet per request. Worth knowing since reliability/model-authenticity
// guarantees are whatever GoRouter itself provides, not the upstream
// model vendor.
//
// Model slugs are read from env vars rather than hardcoded because
// GoRouter's exact catalog naming can vary by account/deployment — check
// your GoRouter dashboard's Model Square (https://gorouter.app/pricing)
// for the exact slug strings available to your wallet, and set the
// GROUTER_MODEL_* env vars below if the defaults here don't match.
const GOROUTER_BASE_URL = process.env.GROUTER_BASE_URL || "https://gorouter.app/v1/";
const GOROUTER_CHAT_URL = `${GOROUTER_BASE_URL}chat/completions`;

// Stay comfortably under this app's existing 60s serverless ceiling
// (see maxDuration on the generate-script routes) so a hung GoRouter
// request fails fast with a clear error instead of the whole function
// timing out silently.
const REQUEST_TIMEOUT_MS = 55_000;

interface GorouterModelConfig {
  primary: string;
  fallback?: string;
}

interface GorouterErrorInfo {
  status: number;
  code?: string;
  raw: string;
  isBlockPage: boolean;
}

// Cloudflare (and similar reverse-proxy bot protection) intercepts the
// request before it ever reaches GoRouter's own auth/API layer and
// returns its own HTML challenge/block page — often on a 403, which is
// the exact same status code a real "bad API key" rejection uses. If we
// don't tell these apart, every Cloudflare block gets misreported as a
// key problem, sending you down the wrong fix entirely.
const BLOCK_PAGE_MARKERS =
  /cloudflare|attention required|cf-error|cf_chl_|checking your browser|just a moment|__cf\$cv\$params|access denied|openresty|<!doctype html|<html/i;

function classifyError({ status, raw, isBlockPage }: GorouterErrorInfo): string {
  if (isBlockPage) {
    return `GoRouter's server blocked this request before it reached the API (status ${status}) — this looks like a Cloudflare/proxy bot-protection page, not a real key rejection. The GoRouter instance needs its API routes excluded from bot protection. Raw response start: ${raw.slice(0, 200)}`;
  }
  if (status === 401 || status === 403) {
    return "GoRouter rejected the API key — check that GROUTER_API_KEY is set correctly in your environment.";
  }
  if (status === 402 || /insufficient|balance|quota exceeded|out of credit/i.test(raw)) {
    return "GoRouter wallet has insufficient balance to complete this request. Top up at gorouter.app.";
  }
  if (status === 429) {
    return "GoRouter rate limit hit — too many requests in a short window. Retrying with the next key/model, if configured.";
  }
  if (status === 404 || /model[_ ]not[_ ]found|no such model|unknown model/i.test(raw)) {
    return `GoRouter doesn't recognize this model slug. Check the exact name in your GoRouter dashboard (gorouter.app/pricing) and set it via the GROUTER_MODEL_* env vars.`;
  }
  if (status >= 500) {
    return "GoRouter (or the upstream model behind it) is temporarily unavailable.";
  }
  return `GoRouter request failed: ${raw}`;
}

async function callGorouterModel(model: string, prompt: string, options?: AIGenerateOptions): Promise<string> {
  return withRotatingKey("GROUTER", async (apiKey) => {
    let response;
    try {
      response = await axios.post(
        GOROUTER_CHAT_URL,
        {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 1024,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: () => true,
        }
      );
    } catch (err) {
      if (axios.isAxiosError(err) && (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT")) {
        const error = new Error(`GoRouter request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (model: ${model}).`) as Error & {
          status?: number;
        };
        error.status = 408;
        throw error;
      }
      const error = new Error(
        `Couldn't reach GoRouter: ${err instanceof Error ? err.message : String(err)}`
      ) as Error & { status?: number };
      error.status = 0;
      throw error;
    }

    if (response.status < 200 || response.status >= 300) {
      // Read the body as text FIRST — a Cloudflare/proxy block page is
      // HTML, not JSON, so trying res.json() first would throw and we'd
      // lose the body content that actually proves what happened.
      const bodyText = typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data ?? "");
      const isBlockPage = BLOCK_PAGE_MARKERS.test(bodyText);

      let raw = `${response.status} ${response.statusText}`;
      let code: string | undefined;
      if (!isBlockPage) {
        try {
          const body = JSON.parse(bodyText);
          raw = body?.error?.message || body?.message || raw;
          code = body?.error?.code || body?.error?.type;
        } catch {
          // Non-JSON, non-block-page body — fall back to status text above.
          if (bodyText) raw = bodyText.slice(0, 300);
        }
      } else {
        raw = bodyText;
      }

      const error = new Error(classifyError({ status: response.status, code, raw, isBlockPage })) as Error & {
        status?: number;
        code?: string;
      };
      error.status = response.status;
      error.code = code;
      throw error;
    }

    const data: unknown = response.data;

    const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      const error = new Error("GoRouter response didn't include the expected message content.") as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
    }
    return content;
  });
}

async function callGorouter(config: GorouterModelConfig, prompt: string, options?: AIGenerateOptions): Promise<string> {
  try {
    return await callGorouterModel(config.primary, prompt, options);
  } catch (err) {
    if (!config.fallback) throw err;
    const status = (err as { status?: number })?.status;
    const isRetryableOnFallback = status === 404 || status === 429 || (typeof status === "number" && status >= 500);
    if (!isRetryableOnFallback) throw err;
    console.warn(`[gorouter] ${config.primary} failed (status ${status}) — falling back to ${config.fallback}.`);
    return await callGorouterModel(config.fallback, prompt, options);
  }
}

function makeGorouterProvider(name: string, config: GorouterModelConfig): AIProvider {
  return {
    name,
    isConfigured: () => hasAnyKey("GROUTER"),

    async summarizeCase(rawText, options) {
      const prompt = `Summarize the following true crime case research into a concise, factual intelligence briefing (max 300 words). Do not speculate beyond what is stated. Write like an investigative briefing, not a Wikipedia article.\n\nSOURCE MATERIAL:\n${rawText}`;
      return callGorouter(config, prompt, options);
    },

    async generateNarratives(caseSummary, options) {
      const prompt = `Based on this case summary, propose 5 distinct narrative/story angles a true crime YouTube creator could take, ranked by how underexplored they likely are. For each, give a one-sentence reason. Return as a numbered list only.\n\nCASE SUMMARY:\n${caseSummary}`;
      const text = await callGorouter(config, prompt, options);
      return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    },

    async scoreTitle(title, context, options) {
      const prompt = `Score this YouTube title from 0-100 for a true crime channel audience, and give 2-3 short reasons for the score. Title: "${title}". ${context ? `Context: ${context}` : ""} Respond in the format "SCORE: <number>\nREASONS: <reason1>; <reason2>"`;
      const text = await callGorouter(config, prompt, options);
      const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
      const reasonsMatch = text.match(/REASONS:\s*(.*)/i);
      return {
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
        reasons: reasonsMatch ? reasonsMatch[1].split(";").map((r) => r.trim()).filter(Boolean) : [],
      };
    },

    async generateText(prompt, options) {
      return callGorouter(config, prompt, options);
    },
  };
}

// Fast/cheap model for structured extraction, JSON generation, research
// synthesis, angle/title/tag/description generation — routes through
// GoRouter using the same model this app already relied on directly
// (Groq's llama-3.3-70b-versatile) for these tasks, via whatever slug
// your GoRouter account exposes for it.
export const gorouterFastProvider = makeGorouterProvider("gorouter-fast", {
  primary: process.env.GROUTER_MODEL_FAST || "claude-opus-4-8",
  fallback: process.env.GROUTER_MODEL_FAST_FALLBACK || "claude-opus-4-8-thinking",
});

export const gorouterWriteProvider = makeGorouterProvider("gorouter-write", {
  primary: process.env.GROUTER_MODEL_WRITE || "claude-opus-5",
  fallback: process.env.GROUTER_MODEL_WRITE_FALLBACK || "claude-opus-4-8",
});