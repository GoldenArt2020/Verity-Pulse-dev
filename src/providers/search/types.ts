export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

export type SearchTopic = "general" | "news";

export interface SearchOptions {
  topic?: SearchTopic;
  /** Restricts results to the last N days. Only meaningful when topic is "news" — Tavily ignores it otherwise. */
  days?: number;
}

export interface SearchProvider {
  name: string;
  isConfigured(): boolean;
  search(query: string, maxResults?: number, options?: SearchOptions): Promise<SearchResult[]>;
}