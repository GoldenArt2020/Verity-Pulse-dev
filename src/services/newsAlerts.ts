// src/services/newsAlerts.ts
import { createServiceClient } from "@/lib/supabase/service";
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
  isNewlyReportedCase: boolean;
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
  const prompt = `You are screening a news headline/snippet for a true crime research tool that surfaces genuinely NEW, fresh cases for creators to potentially cover — not news updates about cases that are already well-established or already public knowledge.

HEADLINE: ${article.title}
SNIPPET: ${article.snippet ?? "(none provided)"}
SOURCE: ${article.sourceName ?? "unknown"}

Evaluate TWO separate things:

1. isMurderCase: Does this article report on a SPECIFIC, NAMED murder or homicide case (not a general crime-statistics story, not an opinion piece)?

2. isNewlyReportedCase: Is this reporting on a case that appears to be NEWLY discovered/occurred/reported — a body just found, a person just reported missing then found dead, an arrest in a previously-unreported incident? Answer FALSE if this is instead:
   - A trial update, guilty plea, verdict, or sentencing in an ALREADY well-known, ongoing legal case (e.g. a case that's clearly been in the news before and is now just reaching a legal milestone)
   - A retrospective, anniversary piece, or "looking back" story about a case from years/decades ago
   - A celebrity or public figure recounting an old personal anecdote involving a killing, not a case under active investigation
   - A book, documentary, or movie tie-in story referencing a historical case
   - Any story where the crime itself is old news and the "new" part is just commentary, a public statement, or legal procedure

Return ONLY valid JSON (no markdown) matching:
{
  "isMurderCase": boolean,
  "isNewlyReportedCase": boolean,
  "caseName": string or null (a short identifying label, e.g. victim's name or "Smith case"),
  "location": string or null (city/region/country if identifiable),
  "summary": string or null (1-2 plain sentences summarizing what's known, only if both booleans above are true)
}

Return ONLY the JSON object.`;

  const raw = await groqProvider.generateText(prompt, { temperature: 0.1, maxTokens: 300 });
  return tryParseJson(raw);
}

interface SkipReasons {
  duplicateUrl: number;
  notMurderCase: number;
  notFreshCase: number;
  classificationFailed: number;
  dedupedSameCase: number;
  alreadyTrackedCase: number;
  insertFailed: number;
}

export interface ProcessArticlesSummary {
  candidates: number;
  inserted: number;
  skipped: number;
  skipReasons: SkipReasons;
}

export async function processIncomingArticles(
  provider: string,
  articles: NormalizedArticle[]
): Promise<ProcessArticlesSummary> {
  // Service-role client: this function only ever runs from the
  // CRON_SECRET-gated poll route, which has no browser session/cookies
  // to authenticate a normal user-scoped client.
  const supabase = createServiceClient();

  let inserted = 0;
  const skipReasons: SkipReasons = {
    duplicateUrl: 0,
    notMurderCase: 0,
    notFreshCase: 0,
    classificationFailed: 0,
    dedupedSameCase: 0,
    alreadyTrackedCase: 0,
    insertFailed: 0,
  };

  // Cheap keyword pass first so we don't burn Groq calls on obviously
  // unrelated articles. Some false positives will still slip through
  // (e.g. "the comedian killed it on stage") — that's what the
  // classification step below is for.
  const candidates = articles.filter(
    (a) => KEYWORD_PATTERN.test(a.title) || (a.snippet && KEYWORD_PATTERN.test(a.snippet))
  );

  // Pull existing tracked case names ONCE per run (not per-article) so a
  // newly-surfaced alert never duplicates something already sitting in
  // the actual Cases area — previously this only checked against OTHER
  // alerts, never against real tracked cases.
  const { data: trackedCases } = await supabase.from("cases").select("name");
  const normalizedTrackedCases = (trackedCases ?? [])
    .map((c) => (c.name ? normalizeCaseName(c.name) : null))
    .filter((n): n is string => !!n);

  for (const article of candidates) {
    const { data: existing } = await supabase
      .from("case_alerts")
      .select("id")
      .eq("url", article.url)
      .maybeSingle();
    if (existing) {
      skipReasons.duplicateUrl++;
      continue;
    }

    let classification: ClassifyResult | null = null;
    try {
      classification = await classifyArticle(article);
    } catch (err) {
      console.error("newsAlerts: classification failed", err);
      skipReasons.classificationFailed++;
      continue;
    }

    if (!classification) {
      skipReasons.classificationFailed++;
      continue;
    }

    if (!classification.isMurderCase) {
      skipReasons.notMurderCase++;
      continue;
    }

    if (!classification.isNewlyReportedCase) {
      skipReasons.notFreshCase++;
      continue;
    }

    if (classification.caseName) {
      const normalizedNew = normalizeCaseName(classification.caseName);

      // Already an actual tracked case in the Cases area — never re-alert on it.
      const alreadyTracked = normalizedTrackedCases.some((c) => isLikelySameCase(normalizedNew, c));
      if (alreadyTracked) {
        skipReasons.alreadyTrackedCase++;
        continue;
      }

      // Already alerted on recently (but not yet promoted/dismissed either way).
      const cutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAlerts } = await supabase
        .from("case_alerts")
        .select("case_name")
        .gte("created_at", cutoff)
        .not("case_name", "is", null);

      const alreadyAlerted = (recentAlerts ?? []).some((r) =>
        r.case_name ? isLikelySameCase(normalizedNew, normalizeCaseName(r.case_name)) : false
      );

      if (alreadyAlerted) {
        skipReasons.dedupedSameCase++;
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
      if (!error.message.includes("duplicate key")) {
        console.error("newsAlerts: insert failed", error.message);
      }
      skipReasons.insertFailed++;
      continue;
    }

    inserted++;
  }

  const skipped = Object.values(skipReasons).reduce((a, b) => a + b, 0);

  return { candidates: candidates.length, inserted, skipped, skipReasons };
}