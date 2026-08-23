import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { getOrFetchYouTubeCoverage, getOrFetchGenreBenchmarkTitles } from "@/services/youtubeCoverage";
import { formatSourcesWithReliability } from "@/lib/sourceReliability";
import { topByVelocity, formatVelocityBlock } from "@/lib/titleVelocity";
import { normalizeTitleIdeas, type TitleIdea } from "@/lib/titleIdeas";
import type { ChannelDNA } from "@/services/creatorDNA";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import type { SearchResult } from "@/providers/search/types";

// Even with this set, Hobby hard-caps at 60s regardless — this route's
// generation call(s) must actually finish inside that window, which is
// what the reduced angle count / cheaper retry below are for.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export interface AngleScores {
  searchDemand: number;
  competition: number;
  emotionalImpact: number;
  originality: number;
  audienceMatch: number;
}

export interface FindingItem {
  title: string;
  snippet: string;
  url: string;
  publishedDate?: string;
}

export interface GeneratedAngle {
  id: string;
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
  script: string | null;
  scriptGeneratedAt: string | null;
  channelFit: string;
  whyWorkOnIt: string;
  curiosityGaps: string[];
  mouthWateringSurprises: string[];
  caseWriteup: string;
  latestFindings: FindingItem[];
  titleIdeas: TitleIdea[];
}

interface RawAngle {
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
  channelFit: string;
  whyWorkOnIt: string;
  curiosityGaps: string[];
  mouthWateringSurprises: string[];
}

interface ParsedResponse {
  angles: RawAngle[];
  caseWriteup: string;
  titleIdeas: TitleIdea[];
}

/**
 * `angleRange`/`titleIdeaRange`/`maxTokens` are parameterized so the retry
 * path (see generateAngleBatch below) can request a smaller, faster batch
 * instead of an identical-cost regeneration — the first attempt's failure
 * is itself a signal that the full-size request is running close to (or
 * over) the 60s Hobby ceiling, so retrying at the same size risks failing
 * the exact same way twice.
 */
function buildPrompt(
  caseName: string,
  category: string | null,
  summary: string,
  caseFacts: unknown,
  backgroundProfiles: unknown,
  youtubeVideos: YouTubeVideoDetail[],
  genreVideos: YouTubeVideoDetail[],
  findings: SearchResult[],
  channelDNA: ChannelDNA | null,
  angleRange: string,
  titleIdeaRange: string
): string {
  const caseVelocity = topByVelocity(youtubeVideos, { limit: 8, minViews: 500 });
  const genreVelocity = topByVelocity(genreVideos, { limit: 8, minViews: 5000 });

  const coverageBlock =
    caseVelocity.length > 0
      ? `EXISTING YOUTUBE COVERAGE ON THIS CASE (ranked by views-per-day — a real momentum/CTR proxy, NOT raw views, since raw views wrongly favor old videos regardless of how well their title is actually performing right now. Study these for what title FORMULAS are actually driving clicks: structure, curiosity gaps, numbers/colons/questions, emotional hooks):\n${formatVelocityBlock(caseVelocity)}`
      : `No existing YouTube coverage data is available for this specific case yet.`;

  const genreBlock =
    genreVelocity.length > 0
      ? `BROADER GENRE BENCHMARK TITLES (currently high-momentum true crime titles across the wider genre${category ? `, biased toward "${category}"-type cases` : ""} — use these when the case-specific coverage above is thin, and to confirm which formulas are working RIGHT NOW across the genre, not just historically on this one case):\n${formatVelocityBlock(genreVelocity)}`
      : `No genre benchmark data available.`;

  const findingsBlock =
    findings.length > 0
      ? `LATEST DEVELOPMENTS (recent web search results, tagged by reliability — use these for real, current case status; prefer HIGH/MEDIUM sources for anything stated as fact; do not invent anything beyond what's here):\n${formatSourcesWithReliability(findings.slice(0, 6), 500)}`
      : `No recent web coverage found beyond the case summary.`;

  const factsBlock = caseFacts
    ? `CASE FACTS DOSSIER (every concrete fact gathered on this case — names, ages, dates, charges, figures, quotes. Use these liberally and specifically in caseWriteup, whyWorkOnIt, and curiosityGaps rather than staying generic):\n${JSON.stringify(caseFacts, null, 2)}`
    : `No detailed facts dossier available yet — work from the case summary and findings below only.`;

  const backgroundBlock =
    Array.isArray(backgroundProfiles) && backgroundProfiles.length > 0
      ? `VICTIM/SUSPECT BACKGROUND PROFILES (daily life, personality, relationships — use these to ground curiosityGaps, whyItWorks, and mouthWateringSurprises in real human detail rather than case-file description):\n${JSON.stringify(backgroundProfiles, null, 2)}`
      : `No background profiles available yet for this case.`;

  const channelBlock = channelDNA
    ? `CHANNEL DNA (this creator's established style/tone/audience — use to judge genuine channel fit):\n${JSON.stringify(channelDNA).slice(0, 1500)}`
    : `No channel DNA available — score channel fit generically for a true crime documentary audience.`;

  return `You are an investigative documentary producer and YouTube growth strategist for a true crime channel. For the case "${caseName}", produce a full production brief.

CASE SUMMARY:
${summary}

${factsBlock}

${backgroundBlock}

${findingsBlock}

${coverageBlock}

${genreBlock}

${channelBlock}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "caseWriteup": string (3-4 sentence narrative writeup grounded in the case facts dossier above — name the actual people, dates, and figures involved, not a vague paraphrase),
  "titleIdeas": [
    {
      "title": string (a REAL, publishable YouTube title for this case — click-optimized, a creator could upload this today; do NOT just restate an angle title),
      "formula": string (name the specific title mechanic used — e.g. "Colon-split shock reveal", "Question hook", "Numbered/countdown structure", "The Truth About X", "Name + shocking detail" — be specific about the mechanic, not just "clickbait"),
      "inspiredBy": string (the exact reference title, copied verbatim from either the case coverage or genre benchmark list above, whose formula this was modeled on — must be one of the titles actually listed above, never invented)
    }
  ] (${titleIdeaRange} items, covering at least 3 distinct formulas across the set — do not repeat the same formula more than 3 times. If both reference lists above are empty, ground "formula" in well-known true crime YouTube title patterns and leave "inspiredBy" as an empty string),
  "angles": [
    {
      "title": string (a compelling angle title),
      "coreQuestion": string (the single question this angle answers),
      "whyItWorks": string (2 concise sentences: why this is underexplored, why it's a fresh entry point),
      "researchFocus": string[] (4-5 specific research directions, referencing named people/events from the facts dossier where relevant),
      "openingHook": string (one narrator sentence to open the episode, using a real concrete detail from the facts dossier, not generic scene-setting),
      "channelFit": string (2 sentences: specifically why this angle suits THIS channel's established style/audience per the Channel DNA above — be concrete, not generic),
      "whyWorkOnIt": string (2 sentences: the concrete case for prioritizing this angle now — freshness, timeliness given latest developments, competitive gap, citing specific dated developments from the facts dossier),
      "curiosityGaps": string[] (3-4 specific unresolved questions drawn from the dossier's unresolvedQuestions and timeline — real gaps, not invented ones),
      "mouthWateringSurprises": string[] (2-3 genuinely surprising, hard-to-believe true facts from this case's dossier or background profiles that would make a viewer say "wait, WHAT?" — the kind of detail worth teasing in the thumbnail or first 15 seconds),
      "scores": {
        "searchDemand": number (0-25),
        "competition": number (0-20, higher = LESS saturated),
        "emotionalImpact": number (0-25),
        "originality": number (0-15),
        "audienceMatch": number (0-15)
      }
    }
  ]
}

Generate ${angleRange} angles. Keep every field concise but SPECIFIC — use real names, dates, and figures from the facts dossier rather than vague description. Never invent a fact not present in the summary, dossier, background profiles, or findings above. Score each angle honestly and distinctly. Order angles by total score descending. Ground everything strictly in the case summary, facts dossier, background profiles, and findings provided — never invent facts.

CRITICAL — do not fabricate connections between this case and unrelated real events, people, or cases (including other true crime cases, mass-casualty events, or public tragedies) unless a findings source explicitly and directly states that connection as documented fact. A search result merely mentioning another event, or this case sharing a superficial theme with another event (e.g. both involving violence, both involving a school, similar names), is NOT a documented connection — do not propose an angle implying one exists. If the provided findings are thin, noisy, or not clearly about "${caseName}" specifically, do not stretch them into a narrative — prefer fewer, well-grounded angles over inventing an angle to fill the count. Return ONLY the JSON object.`;
}

function tryParseJson(text: string): Partial<{ angles: RawAngle[]; caseWriteup: string; titleIdeas: unknown }> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractStringField(text: string, key: string): string {
  const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = text.match(re);
  if (!m) return "";
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return m[1];
  }
}

function extractArrayField(text: string, key: string): unknown[] {
  const keyIdx = text.indexOf(`"${key}"`);
  if (keyIdx === -1) return [];
  const bracketStart = text.indexOf("[", keyIdx);
  if (bracketStart === -1) return [];
  let depth = 0;
  for (let i = bracketStart; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(bracketStart, i + 1);
        const parsed = tryParseJson(`{"v":${candidate}}`) as { v?: unknown } | null;
        if (parsed && Array.isArray(parsed.v)) return parsed.v;
        break;
      }
    }
  }
  return [];
}

/**
 * Groq responses occasionally get cut off mid-object when the batch runs
 * long. Walk the "angles" array brace-by-brace (locating it by key, not by
 * first "[" in the text, since titleIdeas is also an array) and keep every
 * angle object that finished generating before the cutoff.
 */
function salvageTruncatedAngles(cleaned: string): RawAngle[] {
  const anglesKeyIdx = cleaned.indexOf('"angles"');
  const searchFrom = anglesKeyIdx === -1 ? 0 : anglesKeyIdx;
  const arrayStart = cleaned.indexOf("[", searchFrom);
  if (arrayStart === -1) return [];

  const salvaged: RawAngle[] = [];
  let depth = 0;
  let objStart = -1;

  for (let i = arrayStart; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const candidate = cleaned.slice(objStart, i + 1);
        const parsed = tryParseJson(candidate);
        if (parsed && "title" in parsed) {
          salvaged.push(parsed as unknown as RawAngle);
          objStart = -1;
        } else {
          break;
        }
      }
    }
  }
  return salvaged;
}

function parseResponse(raw: string): ParsedResponse {
  const cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) throw new Error("empty_response");
  const fromFirstBrace = cleaned.slice(firstBrace);

  const lastBrace = fromFirstBrace.lastIndexOf("}");
  if (lastBrace !== -1) {
    const wholeCandidate = fromFirstBrace.slice(0, lastBrace + 1);
    const parsed = tryParseJson(wholeCandidate);
    if (parsed?.angles?.length) {
      return {
        angles: parsed.angles,
        caseWriteup: parsed.caseWriteup ?? "",
        titleIdeas: normalizeTitleIdeas(parsed.titleIdeas),
      };
    }
  }

  const salvagedAngles = salvageTruncatedAngles(fromFirstBrace);
  if (salvagedAngles.length > 0) {
    return {
      angles: salvagedAngles,
      caseWriteup: extractStringField(fromFirstBrace, "caseWriteup"),
      titleIdeas: normalizeTitleIdeas(extractArrayField(fromFirstBrace, "titleIdeas")),
    };
  }

  throw new Error("unparseable_response");
}

async function generateAngleBatch(
  caseName: string,
  category: string | null,
  summary: string,
  caseFacts: unknown,
  backgroundProfiles: unknown,
  youtubeVideos: YouTubeVideoDetail[],
  genreVideos: YouTubeVideoDetail[],
  findings: SearchResult[],
  channelDNA: ChannelDNA | null,
  opts: { angleRange: string; titleIdeaRange: string; maxTokens: number }
): Promise<ParsedResponse> {
  const raw = await groqProvider.generateText(
    buildPrompt(
      caseName,
      category,
      summary,
      caseFacts,
      backgroundProfiles,
      youtubeVideos,
      genreVideos,
      findings,
      channelDNA,
      opts.angleRange,
      opts.titleIdeaRange
    ),
    { temperature: 0.7, maxTokens: opts.maxTokens }
  );
  return parseResponse(raw);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  if (!groqProvider.isConfigured()) {
    return NextResponse.json({ error: "Groq is not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("name, summary, case_facts, background_profiles, category")
    .eq("id", caseId)
    .single();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: caseError?.message ?? "Case not found" }, { status: 404 });
  }

  if (!caseRow.summary) {
    return NextResponse.json(
      { error: "This case hasn't been researched yet — no summary available to build an angle from" },
      { status: 400 }
    );
  }

  const [youtubeVideos, genreVideos] = await Promise.all([
    // Force-refreshed on every angle generation rather than relying on the
    // 7-day cache — this app is built around trending/breaking cases, and
    // coverage can shift within hours, not days, when a case is hot.
    getOrFetchYouTubeCoverage(caseId, caseRow.name, { forceRefresh: true }).catch(() => []),
    getOrFetchGenreBenchmarkTitles(caseRow.category ?? null).catch(() => []),
  ]);

  const findings = tavilyProvider.isConfigured()
    ? await tavilyProvider.search(`${caseRow.name} case latest update trial news`, 6).catch(() => [])
    : [];

  let channelDNA: ChannelDNA | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: activeRow } = await supabase
        .from("active_channel")
        .select("channel_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (activeRow?.channel_id) {
        const { data: channelRow } = await supabase
          .from("channels")
          .select("channel_dna")
          .eq("id", activeRow.channel_id)
          .maybeSingle();
        channelDNA = (channelRow?.channel_dna as unknown as ChannelDNA) ?? null;
      }
    }
  } catch {
    channelDNA = null;
  }

  let parsed: ParsedResponse;
  try {
    parsed = await generateAngleBatch(
      caseRow.name,
      caseRow.category ?? null,
      caseRow.summary,
      caseRow.case_facts,
      caseRow.background_profiles,
      youtubeVideos,
      genreVideos,
      findings,
      channelDNA,
      { angleRange: "between 6 and 8", titleIdeaRange: "8-10", maxTokens: 5500 }
    );
  } catch (firstErr) {
    try {
      // Retry deliberately smaller and cheaper than the first attempt, not
      // identical — if the first attempt was slow enough to fail, retrying
      // at the same size risks failing the exact same way again and
      // blowing the 60s budget twice over.
      parsed = await generateAngleBatch(
        caseRow.name,
        caseRow.category ?? null,
        caseRow.summary,
        caseRow.case_facts,
        caseRow.background_profiles,
        youtubeVideos,
        genreVideos,
        findings,
        channelDNA,
        { angleRange: "exactly 4", titleIdeaRange: "4-5", maxTokens: 2600 }
      );
    } catch (secondErr) {
      console.error("generate-angle: both attempts failed", firstErr, secondErr);
      return NextResponse.json(
        {
          error:
            "We couldn't generate angles for this case just now — the response came back incomplete. Please try again.",
        },
        { status: 502 }
      );
    }
  }

  if (parsed.angles.length === 0) {
    return NextResponse.json({ error: "No angles were generated. Please try again." }, { status: 500 });
  }

  const latestFindings: FindingItem[] = findings.slice(0, 6).map((f) => ({
    title: f.title,
    snippet: f.snippet,
    url: f.url,
    publishedDate: f.publishedDate,
  }));

  try {
    const { error: archiveError } = await supabase
      .from("angles")
      .update({ status: "archived" })
      .eq("case_id", caseId)
      .eq("status", "active");

    if (archiveError) {
      return NextResponse.json(
        { error: `Failed to archive previous angles: ${archiveError.message}` },
        { status: 500 }
      );
    }

    const rowsToInsert = parsed.angles.map((a) => ({
      case_id: caseId,
      title: a.title,
      core_question: a.coreQuestion,
      why_it_works: a.whyItWorks,
      research_focus: a.researchFocus,
      opening_hook: a.openingHook,
      scores: a.scores,
      status: "active",
      case_writeup: parsed.caseWriteup,
      channel_fit: a.channelFit,
      why_work_on_it: a.whyWorkOnIt,
      curiosity_gaps: a.curiosityGaps,
      mouth_watering_surprises: a.mouthWateringSurprises,
      latest_findings: latestFindings,
      title_ideas: parsed.titleIdeas,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("angles")
      .insert(rowsToInsert)
      .select(
        "id, title, core_question, why_it_works, research_focus, opening_hook, scores, script, script_generated_at, case_writeup, channel_fit, why_work_on_it, curiosity_gaps, mouth_watering_surprises, latest_findings, title_ideas"
      );

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: `Failed to save angles: ${insertError?.message}` },
        { status: 500 }
      );
    }

    const angles: GeneratedAngle[] = inserted.map((row) => ({
      id: row.id,
      title: row.title,
      coreQuestion: row.core_question,
      whyItWorks: row.why_it_works,
      researchFocus: row.research_focus,
      openingHook: row.opening_hook,
      scores: row.scores,
      script: row.script,
      scriptGeneratedAt: row.script_generated_at,
      caseWriteup: row.case_writeup ?? "",
      channelFit: row.channel_fit ?? "",
      whyWorkOnIt: row.why_work_on_it ?? "",
      curiosityGaps: row.curiosity_gaps ?? [],
      mouthWateringSurprises: row.mouth_watering_surprises ?? [],
      latestFindings: row.latest_findings ?? [],
      titleIdeas: normalizeTitleIdeas(row.title_ideas),
    }));

    return NextResponse.json({ angles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate angle" },
      { status: 500 }
    );
  }
}