import type { TranscriptSegment } from "@/providers/transcript/types";

const NOISE_TAGS = /\[(music|applause|laughter|silence)\]/gi;

/** YouTube's auto-captions are "rolling" — each segment often repeats
 * the tail of the previous segment's words before adding new ones, so
 * naive concatenation produces heavy word-for-word duplication. This
 * strips the overlapping prefix of each segment against the previous
 * segment's end before joining. */
function dedupeRollingOverlap(segments: TranscriptSegment[]): string[] {
  const cleanedTexts: string[] = [];
  let previousWords: string[] = [];

  for (const seg of segments) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let overlap = 0;
    const maxCheck = Math.min(previousWords.length, words.length, 12);
    for (let len = maxCheck; len > 0; len--) {
      const prevTail = previousWords.slice(-len).join(" ").toLowerCase();
      const currHead = words.slice(0, len).join(" ").toLowerCase();
      if (prevTail === currHead) {
        overlap = len;
        break;
      }
    }

    const newWords = words.slice(overlap);
    if (newWords.length > 0) cleanedTexts.push(newWords.join(" "));
    previousWords = words;
  }

  return cleanedTexts;
}

/**
 * Cleans raw captions into readable prose without altering factual
 * content — removes rolling-caption duplication, pure-noise markers
 * ([Music], [Applause]), and excessive whitespace. Never rewords or
 * "corrects" what was actually said; names, numbers, dates, and quotes
 * pass through untouched.
 */
export function cleanTranscript(segments: TranscriptSegment[]): string {
  const deduped = dedupeRollingOverlap(segments);
  const noNoise = deduped.join(" ").replace(NOISE_TAGS, " ");
  return noNoise.replace(/\s+/g, " ").trim();
}