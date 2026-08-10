import type { SearchProvider, SearchResult } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";
import { cleanSourceText } from "@/lib/textCleanup";

const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilySearchOptions {
  topic?: "general" | "news";
  days?: number;
}

export const tavilyProvider: SearchProvider = {
  name: "tavily",
  isConfigured: () => hasAnyKey("TAVILY"),

  async search(query, maxResults = 8, options?: TavilySearchOptions): Promise<SearchResult[]> {
    const data = await withRotatingKey("TAVILY", async (apiKey) => {
      const res = await fetch(TAVILY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults,
          search_depth: "advanced",
          ...(options?.topic ? { topic: options.topic } : {}),
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
      snippet: cleanSourceText(r.content),
      publishedDate: r.published_date,
      source: "tavily",
    }));
  },
};