export interface MediaResult {
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  source: "pexels" | "pixabay" | "unsplash";
  photographer?: string;
  photographerUrl?: string;
}