export type SourceReliability = "HIGH" | "MEDIUM" | "LOW";

// Government, court, and law-enforcement domains — treat as primary-source
// tier. Matched by suffix so subdomains (e.g. "www.cps.gov.uk") still hit.
const HIGH_TIER_SUFFIXES = [
  ".gov",
  ".gov.uk",
  ".police.uk",
  "courts.gov",
  "cps.gov.uk",
  "justice.gov",
];

// Major wire services and national/international outlets with editorial
// standards and legal review — reliable for factual claims, including on
// active/pre-trial cases.
const HIGH_TIER_DOMAINS = new Set([
  "reuters.com",
  "apnews.com",
  "bbc.co.uk",
  "bbc.com",
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "thetimes.com",
  "wsj.com",
  "npr.org",
  "abcnews.go.com",
  "nbcnews.com",
  "cbsnews.com",
  "cnn.com",
  "skynews.com",
  "news.sky.com",
  "itv.com",
  "standard.co.uk",
  "independent.co.uk",
  "telegraph.co.uk",
]);

// Aggregators, forums, social platforms, and self-published/low-editorial
// content — usable for context but not for stating something as fact.
const LOW_TIER_DOMAINS = new Set([
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "medium.com",
  "blogspot.com",
  "wordpress.com",
  "tumblr.com",
]);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Classifies a source URL into a reliability tier for use both in the UI
 * (TopIntelligenceSources) and in AI prompts, so the model is told which
 * sources to lean on for factual claims rather than treating a local news
 * affiliate and a Reddit thread as equally authoritative.
 *
 * Defaults to MEDIUM for anything not explicitly matched (local news
 * affiliates, regional outlets, Wikipedia, press releases from named
 * organizations) — LOW is reserved for sources with no real editorial
 * standard, HIGH for primary/official sources and major national outlets.
 */
export function classifySourceReliability(url: string): SourceReliability {
  const host = hostnameOf(url);
  if (!host) return "MEDIUM";

  if (HIGH_TIER_SUFFIXES.some((suffix) => host.endsWith(suffix))) return "HIGH";
  if (HIGH_TIER_DOMAINS.has(host)) return "HIGH";
  if (LOW_TIER_DOMAINS.has(host)) return "LOW";

  return "MEDIUM";
}

/** Below this length a "source" is almost certainly a search-result snippet
 * rather than extracted article text - Tavily returns nothing usable for
 * paywalled or JS-heavy pages. Marking these matters because a model given a
 * two-line fragment will otherwise report the article as thin, turning a
 * retrieval failure into a false claim about the public record. */
const SNIPPET_ONLY_CHARS = 600;

/** Formats a source list with its reliability tier and publisher inline, for
 * embedding directly in an AI prompt so the model can weight claims
 * accordingly and attribute them to the actual outlet. */
export function formatSourcesWithReliability(
  sources: { title: string; snippet: string; url: string; publishedDate?: string }[],
  snippetChars = 400
): string {
  return sources
    .map((s, i) => {
      const tier = classifySourceReliability(s.url);
      const publisher = hostnameOf(s.url) ?? "unknown source";
      const dateStr = s.publishedDate ? ` (${s.publishedDate})` : "";
      const text = s.snippet.slice(0, snippetChars);
      const truncated = s.snippet.length > snippetChars ? " [text truncated here]" : "";
      const shallow =
        s.snippet.length < SNIPPET_ONLY_CHARS
          ? " [SNIPPET ONLY - full article text could not be retrieved; absence of a detail here is NOT evidence the detail is unreported]"
          : "";
      return `${i + 1}. [${tier}] ${publisher}${shallow} - ${s.title}${dateStr}\n${text}${truncated}`;
    })
    .join("\n\n");
}