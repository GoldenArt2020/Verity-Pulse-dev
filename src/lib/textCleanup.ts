/**
 * Tavily's `content` field is a page-text extraction, not a curated
 * summary — for some sites (local news aggregators, TV station sites)
 * it drags in nav chrome and "latest headlines" tickers, usually
 * separated by literal "######" markers. Left unbounded, a single junky
 * result can balloon to several KB, which bloats downstream prompts and
 * can push a Groq JSON response past its token budget before it finishes
 * — that's what produces "No JSON object found in AI response" errors:
 * the response got cut off mid-array, so there's no closing brace.
 *
 * This keeps only the first section before any "######" divider (real
 * article body almost always comes first, chrome/tickers after), drops
 * obvious headline-ticker lines, and hard-caps length so one bad source
 * can never blow out an entire prompt.
 */
export function cleanSourceText(raw: string, maxChars = 900): string {
  if (!raw) return "";

  const firstSection = raw.split(/#{3,}/)[0] ?? raw;

  const lines = firstSection
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length === 0) return false;
      // Ticker/nav lines tend to be short with no sentence-ending
      // punctuation, piled up back-to-back — real prose rarely looks
      // like that.
      if (l.length < 25 && !/[.!?]$/.test(l)) return false;
      return true;
    });

  const cleaned = lines.join(" ").replace(/\s+/g, " ").trim();
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}…` : cleaned;
}