// src/providers/news/newsdataProvider.ts
import type { NewsProvider, NormalizedArticle } from "./types";

// Free tier allows up to 5 countries per query, so 6 countries needs 2 calls.
const COUNTRY_BATCHES = [
  ["us", "gb", "au", "ca", "ie"],
  ["nz"],
];

const CRIME_QUERY =
  'murder OR homicide OR killed OR "found dead" OR "shot dead" OR stabbed OR manslaughter';

interface NewsDataArticle {
  title?: string;
  link?: string;
  source_id?: string;
  source_name?: string;
  country?: string[];
  pubDate?: string;
  description?: string;
}

interface NewsDataResponse {
  results?: NewsDataArticle[];
}

export const newsdataProvider: NewsProvider = {
  name: "newsdata",

  isConfigured() {
    return !!process.env.NEWSDATA_API_KEY;
  },

  // NewsData.io's free tier doesn't support a "since" cursor (that's a paid
  // feature), so this just runs as a periodic sweep. `case_alerts.url`'s
  // unique constraint handles de-duping against articles already stored,
  // including ones the apitube pass already caught.
  async fetchArticles() {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) return [];

    const articles: NormalizedArticle[] = [];

    for (const batch of COUNTRY_BATCHES) {
      const params = new URLSearchParams({
        apikey: apiKey,
        q: CRIME_QUERY,
        country: batch.join(","),
        language: "en",
      });

      const res = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`);
      if (!res.ok) {
        console.error(`NewsData.io request failed for [${batch.join(",")}]: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as NewsDataResponse;
      for (const a of data.results ?? []) {
        if (!a.title || !a.link) continue;
        articles.push({
          title: a.title,
          url: a.link,
          sourceName: a.source_name ?? a.source_id ?? null,
          sourceCountry: a.country?.[0] ?? null,
          publishedAt: a.pubDate ?? null,
          snippet: a.description ?? null,
        });
      }
    }

    return articles;
  },
};