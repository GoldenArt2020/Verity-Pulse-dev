// src/providers/news/googleNewsRssProvider.ts
import type { NewsProvider, NormalizedArticle } from "./types";

// Google's locale pair per country — hl/gl/ceid all need to agree or
// results silently fall back to a default locale.
const COUNTRY_LOCALES: { code: string; hl: string; gl: string; ceid: string }[] = [
  { code: "us", hl: "en-US", gl: "US", ceid: "US:en" },
  { code: "gb", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { code: "au", hl: "en-AU", gl: "AU", ceid: "AU:en" },
  { code: "ca", hl: "en-CA", gl: "CA", ceid: "CA:en" },
  { code: "ie", hl: "en-IE", gl: "IE", ceid: "IE:en" },
  { code: "nz", hl: "en-NZ", gl: "NZ", ceid: "NZ:en" },
];

const CRIME_QUERY = 'murder OR homicide OR "found dead" OR "shot dead" OR manslaughter';

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripCdata(text: string): string {
  const m = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? m[1] : text;
}

function extractTag(itemXml: string, tag: string): string | null {
  const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return null;
  return decodeXmlEntities(stripCdata(m[1].trim()));
}

/** Google's <source> tag carries the actual original outlet name, even
 * though the <link> itself is a Google redirect — this is the closest
 * thing to a real source name this feed gives us. */
function extractSourceName(itemXml: string): string | null {
  const m = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return m ? decodeXmlEntities(stripCdata(m[1].trim())) : null;
}

function parseItems(xml: string): NormalizedArticle[] {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const articles: NormalizedArticle[] = [];

  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!title || !link) continue;

    articles.push({
      title,
      url: link,
      sourceName: extractSourceName(block),
      sourceCountry: null, // set by caller, which knows which locale this batch came from
      publishedAt: extractTag(block, "pubDate"),
      snippet: null, // Google's <description> is just an HTML-wrapped repeat of the title, not real content
    });
  }

  return articles;
}

export const googleNewsRssProvider: NewsProvider = {
  name: "google-news-rss",

  isConfigured() {
    // No API key needed — always available. Still respects the
    // POLL_INTERVALS_MINUTES gate in the poll route like every other
    // provider, so this doesn't hammer Google unnecessarily.
    return true;
  },

  async fetchArticles() {
    const articles: NormalizedArticle[] = [];

    for (const locale of COUNTRY_LOCALES) {
      const params = new URLSearchParams({
        q: CRIME_QUERY,
        hl: locale.hl,
        gl: locale.gl,
        ceid: locale.ceid,
      });

      try {
        const res = await fetch(`https://news.google.com/rss/search?${params.toString()}`, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; VerityPulseBot/1.0)" },
        });
        if (!res.ok) {
          console.error(`Google News RSS request failed for ${locale.code}: ${res.status}`);
          continue;
        }
        const xml = await res.text();
        const parsed = parseItems(xml).map((a) => ({ ...a, sourceCountry: locale.code }));
        articles.push(...parsed);
      } catch (err) {
        console.error(`Google News RSS request errored for ${locale.code}:`, err);
      }
    }

    return articles;
  },
};