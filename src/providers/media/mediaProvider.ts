import { pexelsProvider } from "./pexelsProvider";
import { pixabayProvider } from "./pixabayProvider";
import { unsplashProvider } from "./unsplashProvider";
import type { MediaResult } from "./types";

export const mediaProvider = {
  isConfigured: () =>
    pexelsProvider.isConfigured() || pixabayProvider.isConfigured() || unsplashProvider.isConfigured(),

  async search(query: string, allowVideo: boolean): Promise<MediaResult | null> {
    if (allowVideo && pexelsProvider.isConfigured()) {
      try {
        const video = await pexelsProvider.searchVideo(query);
        if (video) return video;
      } catch {
        // fall through to photos
      }
    }

    if (pexelsProvider.isConfigured()) {
      try {
        const photo = await pexelsProvider.searchPhoto(query);
        if (photo) return photo;
      } catch {
        // continue to next provider
      }
    }

    if (pixabayProvider.isConfigured()) {
      try {
        const photo = await pixabayProvider.searchPhoto(query);
        if (photo) return photo;
      } catch {
        // continue to next provider
      }
    }

    if (unsplashProvider.isConfigured()) {
      try {
        const photo = await unsplashProvider.searchPhoto(query);
        if (photo) return photo;
      } catch {
        // all providers exhausted
      }
    }

    return null;
  },
};