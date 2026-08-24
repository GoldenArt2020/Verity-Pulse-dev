import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apitubeProvider } from "@/providers/news/apitubeProvider";
import { newsdataProvider } from "@/providers/news/newsdataProvider";
import { guardianProvider } from "@/providers/news/guardianProvider";
import { currentsProvider } from "@/providers/news/currentsProvider";
import { googleNewsRssProvider } from "@/providers/news/googleNewsRssProvider";
import { processIncomingArticles } from "@/services/newsAlerts";
import type { NewsProvider } from "@/providers/news/types";

// Without this, Vercel falls back to a short default timeout for this
// route. Five providers, each potentially doing article-processing work,
// can add up past that default even when running in parallel below.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// How often each provider is allowed to actually hit its external API,
// independent of how often this route gets called (every 5 min via GitHub
// Actions).
const POLL_INTERVALS_MINUTES: Record<string, number> = {
  apitube: 5,
  newsdata: 24 * 60,
  guardian: 15,
  currents: 60,
  // No API key/quota to protect here, but the underlying content skews
  // several days stale (median ~6.6 days per recent sampling), so there's
  // no real benefit to polling more often than this — it exists to catch
  // smaller stories the other four sources miss, not to be fast.
  "google-news-rss": 4 * 60,
};

const PROVIDERS: NewsProvider[] = [
  apitubeProvider,
  newsdataProvider,
  guardianProvider,
  currentsProvider,
  googleNewsRssProvider,
];

async function pollOneProvider(
  provider: NewsProvider,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<[string, unknown]> {
  if (!provider.isConfigured()) {
    return [provider.name, { skipped: "not configured" }];
  }

  const { data: state } = await supabase
    .from("news_poll_state")
    .select("last_polled_at")
    .eq("provider", provider.name)
    .maybeSingle();

  const intervalMs = POLL_INTERVALS_MINUTES[provider.name] * 60 * 1000;
  const lastPolledAt = state?.last_polled_at ? new Date(state.last_polled_at) : null;
  const due = !lastPolledAt || Date.now() - lastPolledAt.getTime() >= intervalMs;

  if (!due) {
    return [provider.name, { skipped: "not due yet" }];
  }

  try {
    const articles = await provider.fetchArticles(lastPolledAt?.toISOString() ?? null);
    const summary = await processIncomingArticles(provider.name, articles);
    await supabase
      .from("news_poll_state")
      .upsert(
        { provider: provider.name, last_polled_at: new Date().toISOString() },
        { onConflict: "provider" }
      );
    return [provider.name, { fetched: articles.length, ...summary }];
  } catch (err) {
    console.error(`news poll: ${provider.name} failed`, err);
    return [provider.name, { error: err instanceof Error ? err.message : "unknown error" }];
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Providers are independent of each other — run them concurrently
  // instead of one at a time, so one slow provider doesn't push the
  // total request past the function's time budget.
  const settled = await Promise.all(PROVIDERS.map((provider) => pollOneProvider(provider, supabase)));

  const results: Record<string, unknown> = {};
  for (const [name, result] of settled) {
    results[name] = result;
  }

  return NextResponse.json({ results });
}