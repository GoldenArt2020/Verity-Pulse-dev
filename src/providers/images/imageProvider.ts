import { pexelsProvider, type ImageResult } from "./pexelsProvider";
import { pixabayProvider } from "./pixabayProvider";
import { unsplashProvider } from "./unsplashProvider";

const PROVIDERS = [pexelsProvider, pixabayProvider, unsplashProvider];

export const imageProvider = {
  isConfigured: () => PROVIDERS.some((p) => p.isConfigured()),

  /**
   * Tries each provider in order (Pexels → Pixabay → Unsplash).
   * Returns the first successful result, or null if all miss/fail.
   */
  async search(query: string): Promise<ImageResult | null> {
    for (const provider of PROVIDERS) {
      if (!provider.isConfigured()) continue;
      try {
        const result = await provider.search(query);
        if (result) return result;
      } catch {
        // provider errored — try the next one rather than failing entirely
        continue;
      }
    }
    return null;
  },
};