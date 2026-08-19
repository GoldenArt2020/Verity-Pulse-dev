"use client";

import { useEffect, useState } from "react";
import { Flame, TrendingDown, ExternalLink, Loader2 } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";
import type { TrendingVideoInsight, DropOffInsight } from "@/services/channelInsights";

interface InsightsResponse {
  connected: boolean;
  trending?: TrendingVideoInsight | null;
  dropOffs?: DropOffInsight[];
  error?: string;
}

export function ChannelInsightsPanel() {
  const { channelId } = useChannelId();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/analytics/channel-insights?youtubeChannelId=${channelId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ connected: false, error: "Failed to load" }))
      .finally(() => setLoading(false));
  }, [channelId]);

  if (!channelId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data?.connected) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
        Connect YouTube Analytics (below) to see trending-video suggestions and viewer drop-off analysis.
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center text-sm text-rose-400">
        {data.error}
      </div>
    );
  }

  const dropOffs = data.dropOffs ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">What&apos;s Trending On Your Channel</h3>
        </div>

        {!data.trending ? (
          <p className="mt-4 text-xs text-slate-500">
            Not enough recent video data yet to identify a trending video — check back after a few more uploads.
          </p>
        ) : (
          <>
            <div className="mt-4 flex gap-3">
              <img
                src={data.trending.video.thumbnailUrl}
                alt=""
                className="h-16 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <a
                  href={`https://youtube.com/watch?v=${data.trending.video.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-1 text-sm font-medium text-white hover:text-blue-400"
                >
                  <span className="line-clamp-2">{data.trending.video.title}</span>
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                </a>
                <div className="mt-1.5 flex gap-3 text-[11px] text-slate-400">
                  <span className="font-medium text-emerald-400">{data.trending.ctrPercent.toFixed(1)}% CTR</span>
                  <span>{data.trending.performance.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-900/30 bg-blue-950/20 p-3.5">
              <p className="text-xs font-medium text-blue-400">Why it&apos;s working &amp; what&apos;s next</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{data.trending.suggestion}</p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">Where Viewers Drop Off</h3>
          {dropOffs.length > 0 && (
            <span className="text-xs text-slate-500">— across your {dropOffs.length} most-viewed recent videos</span>
          )}
        </div>

        {dropOffs.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            Retention data isn&apos;t available yet for your recent videos — this usually needs a bit more watch-time data to populate.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {dropOffs.map((d) => (
              <div key={d.video.videoId} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                <a
                  href={`https://youtube.com/watch?v=${d.video.videoId}&t=${d.timestampSeconds}s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-1 text-xs font-medium text-white hover:text-blue-400"
                >
                  <span className="line-clamp-1">{d.video.title}</span>
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                </a>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-rose-400">-{d.retentionDropPercent.toFixed(1)}%</span>
                  <span className="text-[11px] text-slate-400">at {d.timestampFormatted}</span>
                </div>

                {d.transcriptExcerpt && (
                  <p className="mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-slate-500">
                    &quot;{d.transcriptExcerpt}&quot;
                  </p>
                )}

                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{d.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}