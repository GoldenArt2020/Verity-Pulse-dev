import { createClient } from "@/lib/supabase/server";
import { mediaProvider } from "@/providers/media/mediaProvider";

function buildSearchQuery(category: string): string {
  const moodMap: Record<string, string> = {
    "missing-person": "empty street night mysterious",
    "unsolved-murder": "urban city night crime scene mood",
    "court-case": "courthouse courtroom justice",
    "cold-case": "old archive files dusty",
    "general": "city street night atmospheric",
  };
  return moodMap[category] ?? moodMap["general"];
}

interface CachedVisual {
  url: string;
  type: "image" | "video";
  posterUrl?: string;
  source: string;
}

export async function getOrFetchCaseVisual(
  caseId: string,
  category: string,
  allowVideo: boolean
): Promise<CachedVisual | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cases")
    .select("visual_media_url, visual_media_type, visual_poster_url, visual_media_source")
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

  const query = buildSearchQuery(category);
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