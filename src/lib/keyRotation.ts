type ProviderName = "GROQ" | "TAVILY" | "YOUTUBE" | "GEMINI";

// In-memory per-instance state. Serverless instances are short-lived,
// so this resets on cold start — that's fine, it just means rotation
// restarts at key 1 each time a new instance spins up.
const cursors: Record<ProviderName, number> = {
  GROQ: 0,
  TAVILY: 0,
  YOUTUBE: 0,
  GEMINI: 0,
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

/**
 * Calls `fn` with a rotating API key. On a 429 (rate limit) or 5xx response,
 * automatically retries with the next key in the pool, up to the number of
 * keys available. Throws the last error if every key is exhausted.
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

  for (let attempt = 0; attempt < keys.length; attempt++) {
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
      // else: loop continues, tries next key
    }
  }

  throw lastError;
}