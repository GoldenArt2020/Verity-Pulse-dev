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