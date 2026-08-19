import type { NewsProvider, NormalizedArticle } from "./types";

const CRIME_KEYWORDS = "murder";

interface CurrentsArticle {
  title?: string;
  url?: string;
  published?: string;
  author?: string;
  description?: string;
}

interface CurrentsResponse {
  news?: CurrentsArticle[];
}

export const currentsProvider: NewsProvider = {
  name: "currents",

  isConfigured() {
    return !!process.env.CURRENTS_API_KEY;
  },

  async fetchArticles(sinceISO) {
    const apiKey = process.env.CURRENTS_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({ keywords: CRIME_KEYWORDS, language: "en", apiKey });
    if (sinceISO) {
      params.set("start_date", sinceISO.replace("T", " ").slice(0, 19));
    }

    const res = await fetch(`https://api.currentsapi.services/v1/search?${params.toString()}`);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Currents request failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as CurrentsResponse;
    const articles: NormalizedArticle[] = [];

    for (const a of data.news ?? []) {
      if (!a.title || !a.url) continue;
      articles.push({
        title: a.title,
        url: a.url,
        sourceName: a.author || null,
        sourceCountry: null,
        publishedAt: a.published ?? null,
        snippet: a.description ?? null,
      });
    }

    return articles;
  },
};