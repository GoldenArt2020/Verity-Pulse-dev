import type { SearchProvider, SearchResult } from "./types";
import { withRotatingKey, hasAnyKey } from "@/lib/keyRotation";
import { cleanSourceText } from "@/lib/textCleanup";

const TAVILY_API_URL = "https://api.tavily.com/search";

// No cap here previously meant a slow/hanging Tavily response (e.g. near
// a rate limit, where some APIs stall rather than reject cleanly) would
// ride out the entire request with no way to fail fast or let key
// rotation try a different key. This keeps each individual Tavily call
// well under Vercel's 60s function ceiling, with headroom for the other
// awaited work (Groq, DB writes) in the same request.
const TAVILY_TIMEOUT_MS = 15_000;

interface TavilySearchOptions {
  topic?: "general" | "news";
  days?: number;
}

export const tavilyProvider: SearchProvider = {
  name: "tavily",
  isConfigured: () => hasAnyKey("TAVILY"),

  async search(query, maxResults = 8, options?: TavilySearchOptions): Promise<SearchResult[]> {
    const data = await withRotatingKey("TAVILY", async (apiKey) => {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(TAVILY_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: maxResults,
            search_depth: "advanced",
            // Without this Tavily returns only its own short snippet, which
            // routinely omits detail buried further down an article - prior
            // record, supervision status, exact charge counts. Those gaps
            // then read downstream as gaps in the public record.
            include_raw_content: true,
            ...(options?.topic ? { topic: options.topic } : {}),
            ...(options?.topic === "news" && options?.days ? { days: options.days } : {}),
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          const error = new Error(`Tavily request timed out after ${TAVILY_TIMEOUT_MS / 1000}s`) as Error & {
            status?: number;
          };
          error.status = 408;
          throw error;
        }
        throw err;
      } finally {
        clearTimeout(timeoutHandle);
      }

      if (!res.ok) {
        const error = new Error(`Tavily request failed: ${res.status}`) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }

      return res.json();
    });

  const RAW_CONTENT_CHARS = 6000;

  return (data.results ?? []).map(
    (r: { title: string; url: string; content: string; raw_content?: string | null; published_date?: string }) => {
      const body = r.raw_content?.trim() ? r.raw_content.slice(0, RAW_CONTENT_CHARS) : r.content;
      let publisher: string;
      try {
        publisher = new URL(r.url).hostname.replace(/^www\./, "");
      } catch {
        publisher = "unknown";
      }
      return {
        title: r.title,
        url: r.url,
        snippet: cleanSourceText(body),
        publishedDate: r.published_date,
        // The actual outlet, not the search provider. Attribution rules
        // downstream ask which outlet supports a claim, so this has to name
        // the publisher rather than how the result was found.
        source: publisher,
      };
    }
  );
  },
};