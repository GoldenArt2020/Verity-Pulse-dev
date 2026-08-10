// src/providers/news/types.ts
export interface NormalizedArticle {
  title: string;
  url: string;
  sourceName: string | null;
  sourceCountry: string | null;
  publishedAt: string | null;
  snippet: string | null;
}

export interface NewsProvider {
  name: string;
  isConfigured(): boolean;
  /**
   * Fetch new crime-relevant articles across all configured countries in as
   * few requests as the provider's API allows. `sinceISO` is the timestamp
   * of this provider's last successful poll (null on first run).
   */
  fetchArticles(sinceISO: string | null): Promise<NormalizedArticle[]>;
}