type ProviderName = "GROQ" | "TAVILY" | "YOUTUBE" | "GEMINI" | "CLAUDE" | "GROUTER";

// In-memory per-instance state. Serverless instances are short-lived,
// so this resets on cold start — that's fine, it just means rotation
// restarts at key 1 each time a new instance spins up.
const cursors: Record<ProviderName, number> = {
  GROQ: 0,
  TAVILY: 0,
  YOUTUBE: 0,
  GEMINI: 0,
  CLAUDE: 0,
  GROUTER: 0,
};

function loadKeys(provider: ProviderName): string[] {
  const keys: string[] = [];
  let i = 1;
  while (true) {
    const value = process.env[`${provider}_API_KEY_${i}`];
    if (!value) break;
    keys.push(value);
    i++;
  }
  // Fallback: support the old single-key env var name too,
  // so nothing breaks if only GROQ_API_KEY (no suffix) is set.
  if (keys.length === 0 && process.env[`${provider}_API_KEY`]) {
    keys.push(process.env[`${provider}_API_KEY`]!);
  }
  return keys;
}

export function hasAnyKey(provider: ProviderName): boolean {
  return loadKeys(provider).length > 0;
}

function getNextKey(provider: ProviderName): string {
  const keys = loadKeys(provider);
  if (keys.length === 0) {
    throw new Error(`No API keys configured for ${provider}. Set ${provider}_API_KEY_1 (and optionally _2, _3...) in your environment.`);
  }
  const key = keys[cursors[provider] % keys.length];
  cursors[provider] = (cursors[provider] + 1) % keys.length;
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls `fn` with a rotating API key. On a 429 (rate limit) or 5xx response,
 * automatically retries with the next key in the pool, up to the number of
 * keys available. Throws the last error if every key is exhausted.
 *
 * Waits briefly before each retry (not just switching keys instantly) —
 * Groq's free tier limits are largely TOKENS-per-minute, not just
 * requests-per-minute, and that budget can be effectively shared across
 * keys created under related accounts. Switching keys with zero delay
 * doesn't help when the actual constraint is "wait for the minute window
 * to roll over" — a short wait does. This also naturally smooths out
 * bursts where several Groq calls fire in the same instant (e.g. a
 * recommendations refresh kicking off multiple prompts via Promise.all).
 */
export async function withRotatingKey<T>(
  provider: ProviderName,
  fn: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = loadKeys(provider);
  if (keys.length === 0) {
    throw new Error(`No API keys configured for ${provider}.`);
  }

  let lastError: unknown;
  const maxAttempts = Math.max(keys.length, 3); // even with 1 key, still worth a couple of backoff retries

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = getNextKey(provider);
    try {
      return await fn(key);
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number; response?: { status?: number } })?.status
        ?? (err as { response?: { status?: number } })?.response?.status;

      const isRateLimitOrServerError =
  status === 429 || status === 401 || (typeof status === "number" && status >= 500);

      if (!isRateLimitOrServerError) {
        // Not a rate-limit/server issue — don't burn through keys for
        // something a different key won't fix (e.g. bad request body).
        throw err;
      }

      if (attempt < maxAttempts - 1) {
        // Exponential-ish backoff: 600ms, 1400ms, 2400ms... capped, plus a
        // little jitter so several concurrent calls don't all retry in
        // perfect lockstep and re-collide on the next attempt.
        const waitMs = Math.min(600 * (attempt + 1) * (attempt + 1), 6000) + Math.random() * 300;
        await sleep(waitMs);
      }
      // else: loop continues, tries next key
    }
  }

  throw lastError;
}