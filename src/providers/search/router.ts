import type { SearchProvider, SearchResult } from "./types";
import { tavilyProvider } from "./tavilyProvider";

const providers: SearchProvider[] = [tavilyProvider];

export const searchRouter = {
  async search(query: string, maxResults?: number): Promise<SearchResult[]> {
    const errors: string[] = [];
    for (const provider of providers) {
      if (!provider.isConfigured()) continue;
      try {
        return await provider.search(query, maxResults);
      } catch (err) {
        errors.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new Error(`All search providers failed or unconfigured. ${errors.join(" | ")}`);
  },
};