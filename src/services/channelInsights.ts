import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { youtubePublicCaptionsProvider } from "@/providers/transcript/youtubePublicCaptionsProvider";
import { getVideoPerformance, getVideoRetentionCurve, type VideoPerformance } from "@/providers/youtube/youtubeAnalyticsProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";

const RECENT_VIDEO_COUNT = 15;
const MIN_VIEWS_TO_QUALIFY = 25; // filters out videos too new/small to have a meaningful CTR/retention signal
const MAX_DROPOFF_VIDEOS = 5; // caps parallel Analytics + transcript + Groq calls per request

export interface TrendingVideoInsight {
  video: YouTubeVideoDetail;
  performance: VideoPerformance;
  ctrPercent: number;
  suggestion: string;
}

export interface DropOffInsight {
  video: YouTubeVideoDetail;
  timestampSeconds: number;
  timestampFormatted: string;
  retentionDropPercent: number;
  transcriptExcerpt: string | null;
  explanation: string;
}

function formatTimestamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface QualifyingVideo {
  video: YouTubeVideoDetail;
  performance: VideoPerformance;
}

/**
 * Single shared fetch of recent videos + their performance — both the
 * trending-video pick and the drop-off scan need this same data, so it's
 * fetched once here rather than twice across two separate functions.
 * "Qualifying" means enough views for CTR/retention numbers to actually
 * mean something, not just noise from a video with 3 views.
 */
async function getQualifyingRecentVideos(
  refreshToken: string,
  uploadsPlaylistId: string
): Promise<QualifyingVideo[]> {
  const videos = await youtubeProvider.getChannelVideos(uploadsPlaylistId, RECENT_VIDEO_COUNT);
  if (videos.length === 0) return [];

  const performance = await getVideoPerformance(refreshToken, videos.map((v) => v.videoId));
  const perfById = new Map(performance.map((p) => [p.videoId, p]));

  return videos
    .map((v) => ({ video: v, performance: perfById.get(v.videoId) }))
    .filter((x): x is QualifyingVideo => !!x.performance && x.performance.views >= MIN_VIEWS_TO_QUALIFY);
}

/**
 * Grounds the "work on a similar case / different angle" suggestion in
 * the actual trending video's real title and description — asks Groq to
 * identify what case/subject it's about and propose one concrete next
 * step, rather than a generic "do more like this" platitude.
 */
async function buildTrendingSuggestion(video: YouTubeVideoDetail, ctrPercent: number, views: number): Promise<string> {
  if (!groqProvider.isConfigured()) {
    return "Connect an AI provider to generate a suggestion for this video.";
  }

  const prompt = `A true crime YouTube creator's video is currently outperforming their other recent uploads.

TITLE: "${video.title}"
DESCRIPTION: ${video.description.slice(0, 500)}
CLICK-THROUGH RATE: ${ctrPercent.toFixed(1)}%
VIEWS (last 28 days): ${views}

In 2-3 sentences: (1) identify what specific real case/subject this video is about, (2) explain briefly why it's likely resonating (based only on the title/description given, don't invent facts about the case), and (3) suggest ONE concrete next step — either a genuinely different real case with a similar hook/angle, or an unexplored angle on this SAME case the creator could cover next. Be specific, not generic. Plain text, no markdown, no preamble.`;

  try {
    const text = await groqProvider.generateText(prompt, { temperature: 0.5, maxTokens: 300 });
    return text.trim();
  } catch {
    return "Suggestion generation failed — try refreshing.";
  }
}

export async function getTrendingVideoInsight(
  refreshToken: string,
  uploadsPlaylistId: string
): Promise<TrendingVideoInsight | null> {
  const qualifying = await getQualifyingRecentVideos(refreshToken, uploadsPlaylistId);
  if (qualifying.length === 0) return null;

  const sorted = [...qualifying].sort(
    (a, b) => b.performance.impressionClickThroughRate - a.performance.impressionClickThroughRate
  );
  const picked = sorted[0];

  const ctrPercent = picked.performance.impressionClickThroughRate * 100;
  const suggestion = await buildTrendingSuggestion(picked.video, ctrPercent, picked.performance.views);

  return { video: picked.video, performance: picked.performance, ctrPercent, suggestion };
}

/**
 * Finds the steepest single-step drop in the retention curve, skipping
 * the first 8% of the video — nearly every video has a natural intro
 * drop-off that isn't informative; the interesting drop is the one that
 * happens mid-content, where something specific in the video likely
 * caused it.
 */
function findSteepestDrop(curve: { elapsedVideoTimeRatio: number; audienceWatchRatio: number }[]) {
  let steepest: { ratio: number; dropPercent: number } | null = null;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].elapsedVideoTimeRatio < 0.08) continue;
    const drop = curve[i - 1].audienceWatchRatio - curve[i].audienceWatchRatio;
    if (drop > 0 && (!steepest || drop > steepest.dropPercent)) {
      steepest = { ratio: curve[i].elapsedVideoTimeRatio, dropPercent: drop * 100 };
    }
  }
  return steepest;
}

/**
 * Explains a retention drop using the ACTUAL transcript text at that
 * timestamp — grounded, not guessed. If no transcript is available (e.g.
 * captions off), says so plainly rather than fabricating a plausible-
 * sounding explanation with nothing behind it.
 */
async function buildDropOffExplanation(
  video: YouTubeVideoDetail,
  timestampSeconds: number,
  dropPercent: number,
  transcriptExcerpt: string | null
): Promise<string> {
  if (!transcriptExcerpt) {
    return `Retention drops ${dropPercent.toFixed(1)}% around ${formatTimestamp(timestampSeconds)}, but no transcript is available for this video to confirm what's happening at that point — captions may be disabled.`;
  }

  if (!groqProvider.isConfigured()) {
    return `Retention drops ${dropPercent.toFixed(1)}% around ${formatTimestamp(timestampSeconds)}. Transcript at that point: "${transcriptExcerpt}"`;
  }

  const prompt = `A true crime YouTube video loses ${dropPercent.toFixed(1)}% of its remaining audience at approximately ${formatTimestamp(timestampSeconds)} into the video.

VIDEO TITLE: "${video.title}"

ACTUAL TRANSCRIPT AT THAT MOMENT:
"${transcriptExcerpt}"

In 1-2 sentences, explain the likely reason viewers are dropping off here, grounded ONLY in what the transcript actually shows (a pacing issue, a tangent, a slow section, a shift in tone, repeated information, etc.) — do not invent anything not evidenced by this text. If the transcript doesn't obviously explain a drop-off, say that plainly rather than forcing a reason. Plain text, no markdown, no preamble.`;

  try {
    const text = await groqProvider.generateText(prompt, { temperature: 0.4, maxTokens: 200 });
    return text.trim();
  } catch {
    return `Retention drops ${dropPercent.toFixed(1)}% around ${formatTimestamp(timestampSeconds)}. Transcript at that point: "${transcriptExcerpt}"`;
  }
}

async function getDropOffForSingleVideo(refreshToken: string, video: YouTubeVideoDetail): Promise<DropOffInsight | null> {
  const curve = await getVideoRetentionCurve(refreshToken, video.videoId);
  if (curve.length < 3) return null;

  const drop = findSteepestDrop(curve);
  if (!drop) return null;

  const timestampSeconds = Math.round(drop.ratio * video.durationSeconds);

  let transcriptExcerpt: string | null = null;
  try {
    const transcript = await youtubePublicCaptionsProvider.fetchTranscript(video.videoId);
    if (transcript.status === "available") {
      const windowStart = timestampSeconds - 12;
      const windowEnd = timestampSeconds + 12;
      const nearby = transcript.segments.filter((s) => s.start >= windowStart && s.start <= windowEnd);
      if (nearby.length > 0) {
        transcriptExcerpt = nearby.map((s) => s.text).join(" ").trim();
      }
    }
  } catch {
    // Transcript fetch failing shouldn't block showing the retention data itself.
  }

  const explanation = await buildDropOffExplanation(video, timestampSeconds, drop.dropPercent, transcriptExcerpt);

  return {
    video,
    timestampSeconds,
    timestampFormatted: formatTimestamp(timestampSeconds),
    retentionDropPercent: drop.dropPercent,
    transcriptExcerpt,
    explanation,
  };
}

/**
 * Kept for direct single-video use elsewhere if needed — internally,
 * getDropOffInsightsForChannel below is what the Analytics panel actually
 * calls now, since it scans several recent videos rather than just one.
 */
export async function getDropOffInsight(refreshToken: string, video: YouTubeVideoDetail): Promise<DropOffInsight | null> {
  return getDropOffForSingleVideo(refreshToken, video);
}

/**
 * Scans the most-viewed qualifying recent videos (capped at
 * MAX_DROPOFF_VIDEOS to bound Analytics + transcript + Groq calls per
 * request) and returns a drop-off insight for each one that has usable
 * retention data. Run in parallel since each video's analysis is fully
 * independent of the others.
 */
export async function getDropOffInsightsForChannel(
  refreshToken: string,
  uploadsPlaylistId: string
): Promise<DropOffInsight[]> {
  const qualifying = await getQualifyingRecentVideos(refreshToken, uploadsPlaylistId);
  if (qualifying.length === 0) return [];

  const topByViews = [...qualifying]
    .sort((a, b) => b.performance.views - a.performance.views)
    .slice(0, MAX_DROPOFF_VIDEOS);

  const results = await Promise.all(
    topByViews.map(async ({ video }) => {
      try {
        return await getDropOffForSingleVideo(refreshToken, video);
      } catch {
        // One video's Analytics/transcript call failing shouldn't drop the
        // rest of the batch — skip just that video.
        return null;
      }
    })
  );

  return results.filter((r): r is DropOffInsight => r !== null);
}