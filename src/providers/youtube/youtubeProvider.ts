import type {
  YouTubeChannelStats,
  YouTubeVideoStats,
  YouTubeChannelSummary,
  YouTubeVideoDetail,
} from "./types";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube API key not configured");
  return key;
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function mapChannelSummary(item: any): YouTubeChannelSummary {
  return {
    channelId: item.id,
    title: item.snippet.title,
    handle: item.snippet.customUrl ?? "",
    description: item.snippet.description ?? "",
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? "",
    subscriberCount: parseInt(item.statistics?.subscriberCount ?? "0", 10),
    videoCount: parseInt(item.statistics?.videoCount ?? "0", 10),
    viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? "",
  };
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
    return (data.items ?? []).map(
      (item: { id: { videoId: string }; snippet: { title: string; publishedAt: string } }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        viewCount: 0,
        publishedAt: item.snippet.publishedAt,
      })
    );
  },

  /**
   * Resolves a handle (e.g. "@verypulse" or "verypulse") to a full channel summary.
   * Cost: forHandle = 1 unit. Search fallback = 100 units (only used if forHandle misses).
   * Used once, at channel-connect time, in ChannelOnboarding.
   */
  async resolveHandle(rawHandle: string): Promise<YouTubeChannelSummary | null> {
    const key = getApiKey();
    const handle = rawHandle.trim().startsWith("@") ? rawHandle.trim() : `@${rawHandle.trim()}`;

    const directUrl = `${BASE_URL}/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(
      handle
    )}&key=${key}`;
    const direct = await fetch(directUrl);
    if (!direct.ok) throw new Error(`YouTube resolveHandle failed: ${direct.status}`);
    const directData = await direct.json();

    if (directData.items?.length) {
      return mapChannelSummary(directData.items[0]);
    }

    // Fallback only if forHandle misses — costs 100 units, use sparingly
    const searchUrl = `${BASE_URL}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
      rawHandle
    )}&key=${key}`;
    const search = await fetch(searchUrl);
    if (!search.ok) throw new Error(`YouTube handle search failed: ${search.status}`);
    const searchData = await search.json();

    const channelId = searchData.items?.[0]?.snippet?.channelId;
    if (!channelId) return null;

    return youtubeProvider.getChannelSummaryById(channelId);
  },

  async getChannelSummaryById(channelId: string): Promise<YouTubeChannelSummary | null> {
    const key = getApiKey();
    const url = `${BASE_URL}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube channel lookup failed: ${res.status}`);
    const data = await res.json();
    if (!data.items?.length) return null;
    return mapChannelSummary(data.items[0]);
  },

  /**
   * Fetches up to `limit` videos (with stats) from a channel's uploads playlist.
   * Cost: ~1 unit per 50-video page (playlistItems) + 1 unit per 50-video batch (videos.list).
   * For limit=50 this is ~2 units total — cheap. Used once at channel-connect for Creator DNA.
   */
  async getChannelVideos(uploadsPlaylistId: string, limit = 50): Promise<YouTubeVideoDetail[]> {
    const key = getApiKey();
    const videoIds: string[] = [];
    let pageToken: string | undefined;

    while (videoIds.length < limit) {
      const pageSize = Math.min(50, limit - videoIds.length);
      const url = `${BASE_URL}/playlistItems?part=contentDetails&maxResults=${pageSize}&playlistId=${uploadsPlaylistId}&key=${key}${
        pageToken ? `&pageToken=${pageToken}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`YouTube playlistItems failed: ${res.status}`);
      const data = await res.json();
      const ids = (data.items ?? []).map((i: any) => i.contentDetails.videoId);
      videoIds.push(...ids);

      pageToken = data.nextPageToken;
      if (!pageToken || ids.length === 0) break;
    }

    if (videoIds.length === 0) return [];

    const chunks: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      chunks.push(videoIds.slice(i, i + 50));
    }

    const allVideos: YouTubeVideoDetail[] = [];
    for (const chunk of chunks) {
      const url = `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${chunk.join(
        ","
      )}&key=${key}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
      const data = await res.json();
      for (const item of data.items ?? []) {
        allVideos.push({
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description ?? "",
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? "",
          viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
          likeCount: parseInt(item.statistics?.likeCount ?? "0", 10),
          commentCount: parseInt(item.statistics?.commentCount ?? "0", 10),
          durationSeconds: parseDuration(item.contentDetails.duration),
          tags: item.snippet.tags ?? [],
        });
      }
    }

    return allVideos;
  },

  /**
   * Searches YouTube for videos matching a case/topic (case research, not channel analysis).
   * Cost: 100 units per call — expensive. Callers MUST cache results in DynamoDB and never
   * re-search the same case. Capped at 50 results per call.
   */
  async searchCaseVideos(query: string, maxResults = 50): Promise<YouTubeVideoDetail[]> {
    const key = getApiKey();
    const searchUrl = `${BASE_URL}/search?part=snippet&type=video&maxResults=${Math.min(
      maxResults,
      50
    )}&q=${encodeURIComponent(query)}&key=${key}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`YouTube case search failed: ${searchRes.status}`);
    const searchData = await searchRes.json();
    const ids = (searchData.items ?? []).map((i: any) => i.id.videoId).filter(Boolean);
    if (ids.length === 0) return [];

    const detailsUrl = `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${ids.join(
      ","
    )}&key=${key}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) throw new Error(`YouTube video details failed: ${detailsRes.status}`);
    const detailsData = await detailsRes.json();

    return (detailsData.items ?? []).map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description ?? "",
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? "",
      viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
      likeCount: parseInt(item.statistics?.likeCount ?? "0", 10),
      commentCount: parseInt(item.statistics?.commentCount ?? "0", 10),
      durationSeconds: parseDuration(item.contentDetails.duration),
      tags: item.snippet.tags ?? [],
    }));
  },
};