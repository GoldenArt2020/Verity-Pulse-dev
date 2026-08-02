export interface ImageResult {
  url: string;
  source: "pexels" | "pixabay" | "unsplash";
  photographer?: string;
  photographerUrl?: string;
}

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

export const pexelsProvider = {
  name: "pexels",
  isConfigured: () => Boolean(process.env.PEXELS_API_KEY),

  async search(query: string): Promise<ImageResult | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      if (res.status === 429) return null; // rate limited, let caller fall back
      throw new Error(`Pexels request failed: ${res.status}`);
    }

    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return {
      url: photo.src.large2x ?? photo.src.large,
      source: "pexels",
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  },
};