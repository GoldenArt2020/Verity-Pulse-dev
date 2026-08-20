type ProviderName = "GROQ" | "TAVILY" | "YOUTUBE" | "GEMINI" | "CLAUDE" | "GROUTER";

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
  if (keys.length === 0 && process.env[`${provider}_API_KEY`]) {
    keys.push(process.env[`${provider}_API_KEY`]!);
  }
  return keys;
}

export function hasAnyKey(provider: ProviderName): boolean {
  return loadKeys(provider).length > 0;
}

// Proactive per-key rate limiting — tracks each individual key's call
// timestamps so we can route around a key that's close to its per-minute
// budget BEFORE it 429s, rather than only reacting after the fact.
// 20 is deliberately conservative under Groq's free-tier ~30 RPM per key.
const RPM_LIMITS: Partial<Record<ProviderName, number>> = {
  GROQ: 20,
};

const RPM_WINDOW_MS = 60_000;
const callLog: Map<string, number[]> = new Map();

function pruneOld(timestamps: number[]): number[] {
  const cutoff = Date.now() - RPM_WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

function recordCall(key: string) {
  const existing = pruneOld(callLog.get(key) ?? []);
  existing.push(Date.now());
  callLog.set(key, existing);
}

function callsInWindow(key: string): number {
  const existing = pruneOld(callLog.get(key) ?? []);
  callLog.set(key, existing);
  return existing.length;
}

function pickKey(provider: ProviderName, keys: string[]): { key: string; waitMs: number } {
  const limit = RPM_LIMITS[provider];

  if (!limit) {
    const key = keys[cursors[provider] % keys.length];
    cursors[provider] = (cursors[provider] + 1) % keys.length;
    return { key, waitMs: 0 };
  }

  let best: { key: string; count: number } | null = null;
  for (const k of keys) {
    const count = callsInWindow(k);
    if (count < limit && (!best || count < best.count)) {
      best = { key: k, count };
    }
  }
  if (best) return { key: best.key, waitMs: 0 };

  let soonestFreeAt = Infinity;
  let soonestKey = keys[0];
  for (const k of keys) {
    const timestamps = pruneOld(callLog.get(k) ?? []);
    if (timestamps.length === 0) continue;
    const freeAt = Math.min(...timestamps) + RPM_WINDOW_MS;
    if (freeAt < soonestFreeAt) {
      soonestFreeAt = freeAt;
      soonestKey = k;
    }
  }
  const waitMs = Math.max(0, soonestFreeAt - Date.now()) + 250;
  return { key: soonestKey, waitMs };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRotatingKey<T>(
  provider: ProviderName,
  fn: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = loadKeys(provider);
  if (keys.length === 0) {
    throw new Error(`No API keys configured for ${provider}.`);
  }

  let lastError: unknown;
  const maxAttempts = Math.max(keys.length, 3);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { key, waitMs } = pickKey(provider, keys);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    recordCall(key);

    try {
      return await fn(key);
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number; response?: { status?: number } })?.status
        ?? (err as { response?: { status?: number } })?.response?.status;

      const isRateLimitOrServerError =
        status === 429 || status === 401 || (typeof status === "number" && status >= 500);

      if (!isRateLimitOrServerError) {
        throw err;
      }

      if (attempt < maxAttempts - 1) {
        const backoffMs = Math.min(600 * (attempt + 1) * (attempt + 1), 6000) + Math.random() * 300;
        await sleep(backoffMs);
      }
    }
  }

  throw lastError;
}