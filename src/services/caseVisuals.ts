import { createClient } from "@/lib/supabase/server";
import { mediaProvider } from "@/providers/media/mediaProvider";

const CATEGORY_FALLBACK: Record<string, string> = {
  "missing-person": "empty street night mysterious",
  "unsolved-murder": "urban city night crime scene mood",
  "court-case": "courthouse courtroom justice",
  "cold-case": "old archive files dusty",
  general: "city street night atmospheric",
};

function buildSearchQuery(imageQuery: string | null, category: string): string {
  if (imageQuery) return imageQuery;
  return CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK.general;
}

interface CachedVisual {
  url: string;
  type: "image" | "video";
  posterUrl?: string;
  source: string;
}

/**
 * Returns the cached visual for a case if one exists, otherwise fetches
 * one via mediaProvider and caches it. The search query prefers the
 * case-specific `image_query` generated during research (grounded in
 * that case's real location/setting facts — see caseResearch.ts), so
 * each case gets a visually distinct, relevant image rather than the
 * same handful of images repeating across every case in a category.
 * Falls back to a generic category mood-map only for cases that predate
 * `image_query` or where research hasn't run yet.
 */
export async function getOrFetchCaseVisual(
  caseId: string,
  category: string,
  allowVideo: boolean
): Promise<CachedVisual | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cases")
    .select("visual_media_url, visual_media_type, visual_poster_url, visual_media_source, image_query")
    .eq("id", caseId)
    .maybeSingle();

  if (existing?.visual_media_url) {
    return {
      url: existing.visual_media_url,
      type: (existing.visual_media_type as "image" | "video") ?? "image",
      posterUrl: existing.visual_poster_url ?? undefined,
      source: existing.visual_media_source ?? "unknown",
    };
  }

  if (!mediaProvider.isConfigured()) return null;

  const query = buildSearchQuery(existing?.image_query ?? null, category);
  const result = await mediaProvider.search(query, allowVideo);
  if (!result) return null;

  const supabaseForUpdate = await createClient();
  await supabaseForUpdate
    .from("cases")
    .update({
      visual_media_url: result.url,
      visual_media_type: result.type,
      visual_poster_url: result.posterUrl ?? null,
      visual_media_source: result.source,
      visual_media_fetched_at: new Date().toISOString(),
    })
    .eq("id", caseId);

  return {
    url: result.url,
    type: result.type,
    posterUrl: result.posterUrl,
    source: result.source,
  };
}