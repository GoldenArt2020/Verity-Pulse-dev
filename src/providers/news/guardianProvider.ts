import type { NewsProvider, NormalizedArticle } from "./types";

const SECTIONS = ["uk-news", "us-news", "australia-news", "world"];

const CRIME_QUERY = ["murder", "homicide", "\"found dead\"", "\"shot dead\"", "stabbed", "manslaughter"].join(" OR ");

interface GuardianResult {
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
  sectionName?: string;
  fields?: { trailText?: string };
}

interface GuardianResponse {
  response?: { results?: GuardianResult[] };
}

export const guardianProvider: NewsProvider = {
  name: "guardian",

  isConfigured() {
    return !!process.env.GUARDIAN_API_KEY;
  },

  async fetchArticles(sinceISO) {
    const apiKey = process.env.GUARDIAN_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      q: CRIME_QUERY,
      section: SECTIONS.join("|"),
      "order-by": "newest",
      "show-fields": "trailText",
      "page-size": "10",
      "api-key": apiKey,
    });
    if (sinceISO) {
      params.set("from-date", sinceISO.slice(0, 10));
    }

    const res = await fetch(`https://content.guardianapis.com/search?${params.toString()}`);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Guardian request failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as GuardianResponse;
    const articles: NormalizedArticle[] = [];

    for (const r of data.response?.results ?? []) {
      if (!r.webTitle || !r.webUrl) continue;
      articles.push({
        title: r.webTitle,
        url: r.webUrl,
        sourceName: "The Guardian",
        sourceCountry: null,
        publishedAt: r.webPublicationDate ?? null,
        snippet: r.fields?.trailText ?? null,
      });
    }

    return articles;
  },
};