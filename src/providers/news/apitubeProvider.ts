// src/providers/news/apitubeProvider.ts
import type { NewsProvider, NormalizedArticle } from "./types";

const COUNTRIES = ["us", "gb", "au", "ca", "ie", "nz"];

// Comma = OR within APITube's `title` filter.
const CRIME_TITLE_TERMS = [
  "murder",
  "homicide",
  "killed",
  "found dead",
  "shot dead",
  "stabbed",
  "manslaughter",
].join(",");

interface ApiTubeArticle {
  title?: string;
  url?: string;
  href?: string;
  published_at?: string;
  source?: { name?: string; country?: { id?: string; code?: string } };
  description?: string;
  body?: string;
}

interface ApiTubeResponse {
  results?: ApiTubeArticle[];
}

export const apitubeProvider: NewsProvider = {
  name: "apitube",

  isConfigured() {
    return !!process.env.APITUBE_API_KEY;
  },

  async fetchArticles(sinceISO) {
    const apiKey = process.env.APITUBE_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      title: CRIME_TITLE_TERMS,
      "source.country.code": COUNTRIES.join(","),
      "language.code": "en",
      "sort.by": "published_at",
      "sort.order": "desc",
      per_page: "10",
    });
    if (sinceISO) {
      params.set("published_at.start", sinceISO);
    }

    const res = await fetch(`https://api.apitube.io/v1/news/everything?${params.toString()}`, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`APITube request failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as ApiTubeResponse;
    const articles: NormalizedArticle[] = [];

    for (const a of data.results ?? []) {
      const url = a.url ?? a.href;
      if (!a.title || !url) continue;
      articles.push({
        title: a.title,
        url,
        sourceName: a.source?.name ?? null,
        sourceCountry: a.source?.country?.code ?? a.source?.country?.id ?? null,
        publishedAt: a.published_at ?? null,
        snippet: a.description ?? (a.body ? a.body.slice(0, 400) : null),
      });
    }

    return articles;
  },
};