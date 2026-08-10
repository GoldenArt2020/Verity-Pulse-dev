// src/app/api/news/poll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apitubeProvider } from "@/providers/news/apitubeProvider";
import { newsdataProvider } from "@/providers/news/newsdataProvider";
import { processIncomingArticles } from "@/services/newsAlerts";
import type { NewsProvider } from "@/providers/news/types";

// How often each provider is allowed to actually hit its external API,
// independent of how often this route gets called (every 5 min via GitHub
// Actions). Keeps both free tiers comfortably under quota.
const POLL_INTERVALS_MINUTES: Record<string, number> = {
  apitube: 5,
  newsdata: 24 * 60,
};

const PROVIDERS: NewsProvider[] = [apitubeProvider, newsdataProvider];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const results: Record<string, unknown> = {};

  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) {
      results[provider.name] = { skipped: "not configured" };
      continue;
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
      results[provider.name] = { skipped: "not due yet" };
      continue;
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

      results[provider.name] = { fetched: articles.length, ...summary };
    } catch (err) {
      console.error(`news poll: ${provider.name} failed`, err);
      results[provider.name] = { error: err instanceof Error ? err.message : "unknown error" };
    }
  }

  return NextResponse.json({ results });
}