export interface YouTubeChannelStats {
  channelId: string;
  title: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface YouTubeVideoStats {
  videoId: string;
  title: string;
  viewCount: number;
  publishedAt: string;
}

export interface YouTubeChannelSummary {
  channelId: string;
  title: string;
  handle: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  uploadsPlaylistId: string;
  /** ISO 3166-1 alpha-2 (e.g. "GB", "US"), set by the creator in their
   * YouTube channel settings if they've configured it. Not always present. */
  country: string | null;
}

export interface YouTubeVideoDetail {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number;
  tags: string[];
  channelId: string;
  channelTitle: string;
}