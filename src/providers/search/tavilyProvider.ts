import type { SearchProvider, SearchResult } from "./types";

const TAVILY_API_URL = "https://api.tavily.com/search";

export const tavilyProvider: SearchProvider = {
  name: "tavily",
  isConfigured: () => Boolean(process.env.TAVILY_API_KEY),

  async search(query, maxResults = 8): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("Tavily API key not configured");

    const res = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: "advanced",
      }),
    });

    if (!res.ok) throw new Error(`Tavily request failed: ${res.status}`);

    const data = await res.json();
    return (data.results ?? []).map((r: { title: string; url: string; content: string; published_date?: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      publishedDate: r.published_date,
      source: "tavily",
    }));
  },
};