export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

export interface SearchProvider {
  name: string;
  isConfigured(): boolean;
  search(query: string, maxResults?: number): Promise<SearchResult[]>;
}