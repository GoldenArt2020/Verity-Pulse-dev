// src/services/newsAlerts.ts
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { NormalizedArticle } from "@/providers/news/types";

const KEYWORD_PATTERN =
  /\b(murder(?:ed)?|homicide|killed|manslaughter|found dead|shot dead|stabbed to death|fatally (shot|stabbed|beaten))\b/i;

const DEDUP_WINDOW_DAYS = 21;
const STRIP_WORDS = /\b(trial|case|murder|killing|homicide|investigation|update|day \d+)\b/gi;

/**
 * Reduces a case name to its core identifying words so alerts about the
 * same case from different outlets/articles (which rarely use identical
 * phrasing — "Lindsay Clancy Trial" vs "Lindsay Clancy Murder Case" vs
 * "Clancy Case Day 10") still match each other. Not perfect NLP, but
 * catches the overwhelming majority of same-case duplicates cheaply.
 */
function normalizeCaseName(name: string): string {
  return name
    .toLowerCase()
    .replace(STRIP_WORDS, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelySameCase(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // One containing the other catches "lindsay clancy" vs "lindsay clancy duxbury"
  return a.includes(b) || b.includes(a);
}

interface ClassifyResult {
  isMurderCase: boolean;
  caseName: string | null;
  location: string | null;
  summary: string | null;
}

function tryParseJson(text: string): ClassifyResult | null {
  try {
    const cleaned = text.trim().replace(/```json/gi, "").replace(/```/g, "");
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last === -1) return null;
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}

async function classifyArticle(article: NormalizedArticle): Promise<ClassifyResult | null> {
  const prompt = `You are screening a news headline/snippet for a true crime research tool. Decide whether this article reports on a SPECIFIC, NAMED murder or homicide case (not a general crime-statistics story, not an opinion piece, not a trial-verdict-only follow-up with no case details).

HEADLINE: ${article.title}
SNIPPET: ${article.snippet ?? "(none provided)"}
SOURCE: ${article.sourceName ?? "unknown"}

Return ONLY valid JSON (no markdown) matching:
{
  "isMurderCase": boolean,
  "caseName": string or null (a short identifying label, e.g. victim's name or "Smith case"),
  "location": string or null (city/region/country if identifiable),
  "summary": string or null (1-2 plain sentences summarizing what's known, only if isMurderCase is true)
}

Return ONLY the JSON object.`;

  const raw = await groqProvider.generateText(prompt, { temperature: 0.1, maxTokens: 300 });
  return tryParseJson(raw);
}

export async function processIncomingArticles(provider: string, articles: NormalizedArticle[]) {
  const supabase = await createClient();
  let inserted = 0;
  let skipped = 0;

  // Cheap keyword pass first so we don't burn Groq calls on obviously
  // unrelated articles. Some false positives will still slip through
  // (e.g. "the comedian killed it on stage") — that's what the
  // classification step below is for.
  const candidates = articles.filter(
    (a) => KEYWORD_PATTERN.test(a.title) || (a.snippet && KEYWORD_PATTERN.test(a.snippet))
  );

  for (const article of candidates) {
    const { data: existing } = await supabase
      .from("case_alerts")
      .select("id")
      .eq("url", article.url)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    let classification: ClassifyResult | null = null;
    try {
      classification = await classifyArticle(article);
    } catch (err) {
      console.error("newsAlerts: classification failed", err);
      continue;
    }

    if (!classification?.isMurderCase) {
      skipped++;
      continue;
    }

    if (classification.caseName) {
      const normalizedNew = normalizeCaseName(classification.caseName);
      const cutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentAlerts } = await supabase
        .from("case_alerts")
        .select("case_name")
        .gte("created_at", cutoff)
        .not("case_name", "is", null);

      const alreadyCovered = (recentAlerts ?? []).some((r) =>
        r.case_name ? isLikelySameCase(normalizedNew, normalizeCaseName(r.case_name)) : false
      );

      if (alreadyCovered) {
        skipped++;
        continue;
      }
    }

    const { error } = await supabase.from("case_alerts").insert({
      provider,
      source_country: article.sourceCountry,
      headline: article.title,
      url: article.url,
      source_name: article.sourceName,
      published_at: article.publishedAt,
      summary: classification.summary,
      case_name: classification.caseName,
      location: classification.location,
      status: "pending",
    });

    if (error) {
      // Duplicate-key races are expected when polls overlap; anything else
      // is worth logging.
      if (!error.message.includes("duplicate key")) {
        console.error("newsAlerts: insert failed", error.message);
      }
      continue;
    }

    inserted++;
  }

  return { candidates: candidates.length, inserted, skipped };
}