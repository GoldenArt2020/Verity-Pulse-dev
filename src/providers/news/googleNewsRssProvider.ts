// src/providers/news/googleNewsRssProvider.ts
import type { NewsProvider, NormalizedArticle } from "./types";

// Free, no API key required — Google News' RSS search endpoint. Median
// item age runs several days stale per sampling, so this exists to catch
// smaller regional stories the paid/faster sources miss, not to be fast
// (see the polling-interval comment in route.ts).
const QUERIES = ["murder charged", "found dead investigation", "homicide arrest"];

function extractTag(itemXml: string, tag: string): string | null {
  const match = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  return match[1]
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .trim();
}

function parseItems(xml: string): NormalizedArticle[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const articles: NormalizedArticle[] = [];

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    if (!title || !link) continue;

    const pubDate = extractTag(item, "pubDate");
    const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

    articles.push({
      title,
      url: link,
      sourceName: sourceMatch ? sourceMatch[1].trim() : null,
      sourceCountry: null,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      // Google's RSS search feed doesn't include a description/snippet field.
      snippet: null,
    });
  }

  return articles;
}

export const googleNewsRssProvider: NewsProvider = {
  name: "google-news-rss",

  isConfigured() {
    return true; // no key needed
  },

  async fetchArticles() {
    // Google News RSS has no reliable date-filter query param — sinceISO
    // is intentionally unused; dedup against already-seen URLs happens in
    // processIncomingArticles downstream.
    const batches = await Promise.all(
      QUERIES.map(async (q) => {
        try {
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
          const res = await fetch(url);
          if (!res.ok) return [];
          const xml = await res.text();
          return parseItems(xml);
        } catch {
          return [];
        }
      })
    );

    const seen = new Set<string>();
    const merged: NormalizedArticle[] = [];
    for (const batch of batches) {
      for (const a of batch) {
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        merged.push(a);
      }
    }
    return merged;
  },
};