import type { MediaResult } from "./types";

const PEXELS_PHOTO_URL = "https://api.pexels.com/v1/search";
const PEXELS_VIDEO_URL = "https://api.pexels.com/videos/search";

export const pexelsProvider = {
  name: "pexels" as const,
  isConfigured: () => Boolean(process.env.PEXELS_API_KEY),

  async searchVideo(query: string): Promise<MediaResult | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `${PEXELS_VIDEO_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&size=medium`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      if (res.status === 429) return null;
      throw new Error(`Pexels video request failed: ${res.status}`);
    }

    const data = await res.json();
    const video = data.videos?.[0];
    if (!video) return null;

    const file =
      video.video_files.find((f: { width: number }) => f.width >= 960 && f.width <= 1280) ??
      video.video_files[0];
    if (!file) return null;

    return {
      type: "video",
      url: file.link,
      posterUrl: video.video_pictures?.[0]?.picture,
      source: "pexels",
      photographer: video.user?.name,
      photographerUrl: video.user?.url,
    };
  },

  async searchPhoto(query: string): Promise<MediaResult | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `${PEXELS_PHOTO_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      if (res.status === 429) return null;
      throw new Error(`Pexels photo request failed: ${res.status}`);
    }

    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return {
      type: "image",
      url: photo.src.large2x ?? photo.src.large,
      source: "pexels",
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  },
};