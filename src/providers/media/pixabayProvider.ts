import type { MediaResult } from "./types";

const PIXABAY_API_URL = "https://pixabay.com/api/";

export const pixabayProvider = {
  name: "pixabay" as const,
  isConfigured: () => Boolean(process.env.PIXABAY_API_KEY),

  async searchPhoto(query: string): Promise<MediaResult | null> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `${PIXABAY_API_URL}?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`
    );

    if (!res.ok) {
      if (res.status === 429) return null;
      throw new Error(`Pixabay request failed: ${res.status}`);
    }

    const data = await res.json();
    const hit = data.hits?.[0];
    if (!hit) return null;

    return {
      type: "image",
      url: hit.largeImageURL,
      source: "pixabay",
      photographer: hit.user,
      photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
    };
  },
};