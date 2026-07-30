import type { YouTubeChannelStats, YouTubeVideoStats } from "./types";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube API key not configured");
  return key;
}

export const youtubeProvider = {
  name: "youtube",
  isConfigured: () => Boolean(process.env.YOUTUBE_API_KEY),

  async getChannelStats(channelId: string): Promise<YouTubeChannelStats> {
    const key = getApiKey();
    const res = await fetch(`${BASE_URL}/channels?part=statistics,snippet&id=${channelId}&key=${key}`);
    if (!res.ok) throw new Error(`YouTube channel request failed: ${res.status}`);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) throw new Error("Channel not found");
    return {
      channelId,
      title: item.snippet.title,
      subscriberCount: parseInt(item.statistics.subscriberCount, 10),
      viewCount: parseInt(item.statistics.viewCount, 10),
      videoCount: parseInt(item.statistics.videoCount, 10),
    };
  },

  async searchVideos(query: string, maxResults = 20): Promise<YouTubeVideoStats[]> {
    const key = getApiKey();
    const res = await fetch(
      `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${key}`
    );
    if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
    const data = await res.json();
    return (data.items ?? []).map((item: { id: { videoId: string }; snippet: { title: string; publishedAt: string } }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      viewCount: 0,
      publishedAt: item.snippet.publishedAt,
    }));
  },
};