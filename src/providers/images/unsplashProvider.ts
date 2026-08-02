import type { ImageResult } from "./pexelsProvider";

const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";

export const unsplashProvider = {
  name: "unsplash",
  isConfigured: () => Boolean(process.env.UNSPLASH_API_KEY),

  async search(query: string): Promise<ImageResult | null> {
    const apiKey = process.env.UNSPLASH_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    );

    if (!res.ok) {
      if (res.status === 429) return null;
      throw new Error(`Unsplash request failed: ${res.status}`);
    }

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    return {
      url: result.urls.regular,
      source: "unsplash",
      photographer: result.user?.name,
      photographerUrl: result.user?.links?.html,
    };
  },
};