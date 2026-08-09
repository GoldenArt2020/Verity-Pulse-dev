import type { SearchProvider, SearchResult, SearchOptions } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";

const TAVILY_API_URL = "https://api.tavily.com/search";

export const tavilyProvider: SearchProvider = {
  name: "tavily",
  isConfigured: () => hasAnyKey("TAVILY"),

  async search(query, maxResults = 8, options?: SearchOptions): Promise<SearchResult[]> {
    const data = await withRotatingKey("TAVILY", async (apiKey) => {
      const res = await fetch(TAVILY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults,
          search_depth: "advanced",
          topic: options?.topic ?? "general",
          ...(options?.topic === "news" && options?.days ? { days: options.days } : {}),
        }),
      });

      if (!res.ok) {
        const error = new Error(`Tavily request failed: ${res.status}`) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }

      return res.json();
    });

    return (data.results ?? []).map((r: { title: string; url: string; content: string; published_date?: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      publishedDate: r.published_date,
      source: "tavily",
    }));
  },
};