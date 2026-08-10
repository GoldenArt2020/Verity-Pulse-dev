// src/services/newsAlerts.ts
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { NormalizedArticle } from "@/providers/news/types";

const KEYWORD_PATTERN =
  /\b(murder(?:ed)?|homicide|killed|manslaughter|found dead|shot dead|stabbed to death|fatally (shot|stabbed|beaten))\b/i;

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