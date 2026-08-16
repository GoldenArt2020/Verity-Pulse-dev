import { createClient } from "@/lib/supabase/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import { scoreVideoRelevance, type RelevanceContext } from "@/lib/videoRelevanceScoring";
import { categorizeVideo } from "@/lib/videoCategorization";

interface CaseFactsPerson {
  name: string;
  role: string;
  details: string;
}

interface CaseFacts {
  people?: CaseFactsPerson[];
  locations?: string[];
}

const VICTIM_ROLE_PATTERN = /victim/i;
const SUSPECT_ROLE_PATTERN = /suspect|accused|defendant|perpetrator|convicted/i;

/**
 * Builds the multi-query search fan-out from whatever the case actually
 * has on file — always searches the base case-name angles, and layers on
 * name/location-specific queries only when caseFacts has that data (a
 * freshly-stubbed case with no research yet still gets a reasonable
 * search set from the name alone).
 */
function buildSearchQueries(caseName: string, facts: CaseFacts | null): string[] {
  const base = [
    caseName,
    `${caseName} investigation`,
    `${caseName} police`,
    `${caseName} documentary`,
    `${caseName} latest`,
    `${caseName} court`,
    `${caseName} interview`,
    `${caseName} timeline`,
    `${caseName} news`,
  ];

  const people = facts?.people ?? [];
  const victims = people.filter((p) => VICTIM_ROLE_PATTERN.test(p.role)).map((p) => p.name);
  const suspects = people.filter((p) => SUSPECT_ROLE_PATTERN.test(p.role)).map((p) => p.name);
  const locations = facts?.locations ?? [];

  const targeted: string[] = [];
  for (const v of victims.slice(0, 2)) targeted.push(`"${v}" ${caseName}`);
  for (const s of suspects.slice(0, 2)) targeted.push(`"${s}" ${caseName}`);
  for (const loc of locations.slice(0, 2)) targeted.push(`"${caseName}" ${loc}`);

  return [...base, ...targeted];
}

/**
 * Runs the full discovery pass for a case: fans out across multiple
 * angled YouTube searches (not one generic query), dedupes, scores every
 * candidate for actual relevance rather than trusting search order,
 * drops anything under threshold, flags near-duplicates, categorizes by
 * content type, and upserts the survivors into video_sources.
 *
 * Does NOT touch transcripts — that's a separate pass (see
 * videoTranscriptAcquisition.ts) so a slow/flaky transcript fetch never
 * blocks source discovery from completing and being visible to the user.
 */
export async function discoverVideoSources(caseId: string, caseName: string): Promise<number> {
  if (!youtubeProvider.isConfigured()) {
    throw new Error("YouTube is not configured — cannot discover video sources");
  }

  const supabase = await createClient();
  const { data: caseRow } = await supabase.from("cases").select("case_facts").eq("id", caseId).single();
  const facts = (caseRow?.case_facts as CaseFacts | null) ?? null;

  const queries = buildSearchQueries(caseName, facts);

  const candidates = new Map<string, { video: YouTubeVideoDetail; matchedQueries: Set<string> }>();

  const batches = await Promise.all(
    queries.map(async (q) => ({
      query: q,
      videos: await youtubeProvider.searchCaseVideos(q, 15).catch(() => [] as YouTubeVideoDetail[]),
    }))
  );

  for (const { query, videos } of batches) {
    for (const video of videos) {
      const existing = candidates.get(video.videoId);
      if (existing) {
        existing.matchedQueries.add(query);
      } else {
        candidates.set(video.videoId, { video, matchedQueries: new Set([query]) });
      }
    }
  }

  const ctx: RelevanceContext = {
    caseName,
    victimNames: (facts?.people ?? []).filter((p) => VICTIM_ROLE_PATTERN.test(p.role)).map((p) => p.name),
    suspectNames: (facts?.people ?? []).filter((p) => SUSPECT_ROLE_PATTERN.test(p.role)).map((p) => p.name),
    locations: facts?.locations ?? [],
  };

  const scored = scoreVideoRelevance(candidates, ctx);

  if (scored.length === 0) return 0;

  const rows = scored.map(({ video, relevanceScore, matchedQueries }) => ({
    case_id: caseId,
    youtube_video_id: video.videoId,
    youtube_url: `https://www.youtube.com/watch?v=${video.videoId}`,
    video_title: video.title,
    channel_name: video.channelTitle,
    channel_id: video.channelId,
    publication_date: video.publishedAt,
    video_description: video.description,
    source_category: categorizeVideo(video.title, video.description, video.channelTitle),
    relevance_score: relevanceScore,
    matched_queries: matchedQueries,
    transcript_status: "not_attempted",
  }));

  const { error } = await supabase
    .from("video_sources")
    .upsert(rows, { onConflict: "case_id,youtube_video_id" });

  if (error) {
    throw new Error(`Failed to save video sources: ${error.message}`);
  }

  return rows.length;
}