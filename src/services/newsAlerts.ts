// src/services/newsAlerts.ts
import { createServiceClient } from "@/lib/supabase/service";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { NormalizedArticle } from "@/providers/news/types";

const KEYWORD_PATTERN =
  /\b(murder(?:ed)?|homicide|killed|manslaughter|found dead|shot dead|stabbed to death|fatally (shot|stabbed|beaten))\b/i;

const DEDUP_WINDOW_DAYS = 21;
const STRIP_WORDS = /\b(trial|case|murder|killing|homicide|investigation|update|day \d+)\b/gi;

// Classification is the slow part (a Groq call per article) — process
// articles in small concurrent batches rather than fully sequentially.
// groqProvider itself caps global concurrency and paces request starts,
// so this doesn't risk re-triggering rate limits; it just keeps that
// queue fed instead of leaving it idle between each article's other,
// non-Groq work (DB round-trips).
const CLASSIFY_CONCURRENCY = 5;

// Hard ceiling on how many articles this run will classify, regardless of
// how many candidates were found. Providers run concurrently now (see
// route.ts), all funneling into groqProvider's own 2-request global cap —
// without a ceiling here, a run that surfaces many candidates at once
// could queue long enough to exceed the route's time budget. Articles
// beyond this cap are simply skipped for this run; since polling repeats
// every 5 minutes and dedup is URL-based, most will either get reprocessed
// next run if the provider still returns them, or age out harmlessly.
const MAX_ARTICLES_PER_RUN = 15;
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
interface TrendingClassifyResult {
  isSignificantCaseDevelopment: boolean;
  isHighProfile: boolean;
  caseName: string | null;
  location: string | null;
  developmentType: string | null;
  summary: string | null;
}

function tryParseJson<T>(text: string): T | null {
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
  return tryParseJson<ClassifyResult>(raw);
}

async function classifyTrendingUpdate(article: NormalizedArticle): Promise<TrendingClassifyResult | null> {
  const prompt = `You are screening a news headline/snippet for a true crime research tool that surfaces SIGNIFICANT DEVELOPMENTS in already-known, high-profile cases — the opposite of brand-new case discovery.

HEADLINE: ${article.title}
SNIPPET: ${article.snippet ?? "(none provided)"}
SOURCE: ${article.sourceName ?? "unknown"}

Evaluate:

1. isSignificantCaseDevelopment: Is this reporting a MAJOR milestone in an ALREADY well-known, high-profile murder/homicide case — a verdict, guilty plea, jury deliberation reaching a decision point, sentencing, a major new piece of evidence, or a similarly newsworthy legal/investigative development? Answer FALSE for minor procedural news, routine hearing scheduling, or anything that isn't a genuinely significant moment in the case.

2. isHighProfile: Does this case appear to already have substantial national/broad public attention (not a small local story)?

Return ONLY valid JSON (no markdown) matching:
{
  "isSignificantCaseDevelopment": boolean,
  "isHighProfile": boolean,
  "caseName": string or null,
  "location": string or null,
  "developmentType": string or null (e.g. "verdict", "guilty plea", "jury deliberating", "sentencing", "major evidence"),
  "summary": string or null
}

Return ONLY the JSON object.`;

  const raw = await groqProvider.generateText(prompt, { temperature: 0.1, maxTokens: 300 });
  return tryParseJson<TrendingClassifyResult>(raw);
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

  if (candidates.length === 0) {
    return { candidates: 0, inserted: 0, skipped: 0, skipReasons };
  }

  // Batched duplicate-URL check — ONE query for every candidate instead
  // of one round-trip per article.
  const { data: existingUrlRows } = await supabase
    .from("case_alerts")
    .select("url")
    .in("url", candidates.map((a) => a.url));
  const existingUrls = new Set((existingUrlRows ?? []).map((r) => r.url));

  // Pull existing tracked case names ONCE per run so a newly-surfaced
  // alert never duplicates something already sitting in the actual Cases
  // area.
  const { data: trackedCases } = await supabase.from("cases").select("name");
  const normalizedTrackedCases = (trackedCases ?? [])
    .map((c) => (c.name ? normalizeCaseName(c.name) : null))
    .filter((n): n is string => !!n);

  // Recent-alert case names, ALSO fetched once — this query was
  // previously re-run per article despite always returning the same
  // result within a single run. This array is appended to as new cases
  // get inserted during this run, so within-run duplicates (two
  // articles about the same fresh case) still get caught.
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentAlertRows } = await supabase
    .from("case_alerts")
    .select("case_name")
    .gte("created_at", cutoff)
    .not("case_name", "is", null);
  const normalizedRecentCaseNames = (recentAlertRows ?? [])
    .map((r) => (r.case_name ? normalizeCaseName(r.case_name) : null))
    .filter((n): n is string => !!n);

  const toClassify = candidates
    .filter((a) => {
      if (existingUrls.has(a.url)) {
        skipReasons.duplicateUrl++;
        return false;
      }
      return true;
    })
    .slice(0, MAX_ARTICLES_PER_RUN);

  async function processOne(article: NormalizedArticle): Promise<void> {
    let classification: ClassifyResult | null = null;
    try {
      classification = await classifyArticle(article);
    } catch (err) {
      console.error("newsAlerts: classification failed", err);
      skipReasons.classificationFailed++;
      return;
    }

    if (!classification) {
      skipReasons.classificationFailed++;
      return;
    }

    if (!classification.isMurderCase) {
      skipReasons.notMurderCase++;
      return;
    }

    if (!classification.isNewlyReportedCase) {
      skipReasons.notFreshCase++;
      return;
    }

    if (classification.caseName) {
      const normalizedNew = normalizeCaseName(classification.caseName);

      const alreadyTracked = normalizedTrackedCases.some((c) => isLikelySameCase(normalizedNew, c));
      if (alreadyTracked) {
        skipReasons.alreadyTrackedCase++;
        return;
      }

      const alreadyAlerted = normalizedRecentCaseNames.some((c) => isLikelySameCase(normalizedNew, c));
      if (alreadyAlerted) {
        skipReasons.dedupedSameCase++;
        return;
      }

      // Record it immediately so a second article about the same fresh
      // case, classified concurrently in this same batch, sees it too.
      // NOTE: with CLASSIFY_CONCURRENCY > 1, two articles about the same
      // brand-new case landing in the exact same batch can both pass this
      // check before either pushes — a small, accepted race. The
      // duplicate-key guard on insert below is the final backstop for
      // that rare case, not just cosmetic.
      normalizedRecentCaseNames.push(normalizedNew);
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
      return;
    }

    inserted++;
  }

  for (let i = 0; i < toClassify.length; i += CLASSIFY_CONCURRENCY) {
    const batch = toClassify.slice(i, i + CLASSIFY_CONCURRENCY);
    await Promise.all(batch.map(processOne));
  }

  const skipped = Object.values(skipReasons).reduce((a, b) => a + b, 0);

  return { candidates: candidates.length, inserted, skipped, skipReasons };
}
export interface ProcessTrendingSummary {
  candidates: number;
  inserted: number;
  skipped: number;
}

/**
 * Parallel track to processIncomingArticles: instead of screening for
 * brand-new, never-seen cases, this screens for SIGNIFICANT DEVELOPMENTS
 * in already-known, high-profile cases (verdicts, guilty pleas, jury
 * decisions, sentencing) — the exact category the fresh-case screen above
 * is designed to reject. Writes to trending_updates, a separate table,
 * so this never interferes with the fresh-case dedup logic or the
 * existing Discover "new cases" feed.
 */
export async function processTrendingUpdates(
  provider: string,
  articles: NormalizedArticle[]
): Promise<ProcessTrendingSummary> {
  const supabase = createServiceClient();

  let inserted = 0;
  let skipped = 0;

  // Reuse the same murder/homicide keyword prefilter — a significant
  // development in a murder case will still mention the crime itself in
  // most headlines/snippets, so this remains a cheap, effective first pass.
  const candidates = articles.filter(
    (a) => KEYWORD_PATTERN.test(a.title) || (a.snippet && KEYWORD_PATTERN.test(a.snippet))
  );

  if (candidates.length === 0) {
    return { candidates: 0, inserted: 0, skipped: 0 };
  }

  const { data: existingUrlRows } = await supabase
    .from("trending_updates")
    .select("url")
    .in("url", candidates.map((a) => a.url));
  const existingUrls = new Set((existingUrlRows ?? []).map((r) => r.url));

  const toClassify = candidates
    .filter((a) => !existingUrls.has(a.url))
    .slice(0, MAX_ARTICLES_PER_RUN);

  async function processOne(article: NormalizedArticle): Promise<void> {
    let classification: TrendingClassifyResult | null = null;
    try {
      classification = await classifyTrendingUpdate(article);
    } catch (err) {
      console.error("newsAlerts: trending classification failed", err);
      skipped++;
      return;
    }

    if (!classification || !classification.isSignificantCaseDevelopment || !classification.isHighProfile) {
      skipped++;
      return;
    }

    const { error } = await supabase.from("trending_updates").insert({
      provider,
      source_country: article.sourceCountry,
      headline: article.title,
      url: article.url,
      source_name: article.sourceName,
      published_at: article.publishedAt,
      summary: classification.summary,
      case_name: classification.caseName,
      location: classification.location,
      development_type: classification.developmentType,
      status: "pending",
    });

    if (error) {
      if (!error.message.includes("duplicate key")) {
        console.error("newsAlerts: trending insert failed", error.message);
      }
      skipped++;
      return;
    }

    inserted++;
  }

  for (let i = 0; i < toClassify.length; i += CLASSIFY_CONCURRENCY) {
    const batch = toClassify.slice(i, i + CLASSIFY_CONCURRENCY);
    await Promise.all(batch.map(processOne));
  }

  return { candidates: candidates.length, inserted, skipped };
}