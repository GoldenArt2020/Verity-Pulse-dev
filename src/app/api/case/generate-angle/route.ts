import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { getOrFetchYouTubeCoverage } from "@/services/youtubeCoverage";
import type { ChannelDNA } from "@/services/creatorDNA";
import type { YouTubeVideoDetail } from "@/providers/youtube/types";
import type { SearchResult } from "@/providers/search/types";

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
  caseWriteup: string;
  latestFindings: FindingItem[];
  titleIdeas: string[];
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
}

interface ParsedResponse {
  angles: RawAngle[];
  caseWriteup: string;
  titleIdeas: string[];
}

function buildPrompt(
  caseName: string,
  summary: string,
  youtubeVideos: YouTubeVideoDetail[],
  findings: SearchResult[],
  channelDNA: ChannelDNA | null
): string {
  const topPerformers = [...youtubeVideos]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10);

  const coverageBlock =
    topPerformers.length > 0
      ? `EXISTING YOUTUBE COVERAGE (top performing titles on this case, by views â€” study these for what title FORMULAS work: structure, curiosity gaps, use of numbers/colons/questions, emotional hooks):\n${topPerformers
          .map((v, i) => `${i + 1}. "${v.title}" â€” ${v.viewCount.toLocaleString()} views`)
          .join("\n")}`
      : `No existing YouTube coverage data is available for this case.`;

  const findingsBlock =
    findings.length > 0
      ? `LATEST DEVELOPMENTS (recent web search results â€” use these for real, current case status; do not invent anything beyond what's here):\n${findings
          .slice(0, 6)
          .map((f, i) => `${i + 1}. ${f.title} (${f.publishedDate ?? "undated"}): ${f.snippet.slice(0, 220)}`)
          .join("\n")}`
      : `No recent web coverage found beyond the case summary.`;

  const channelBlock = channelDNA
    ? `CHANNEL DNA (this creator's established style/tone/audience â€” use to judge genuine channel fit):\n${JSON.stringify(channelDNA).slice(0, 1500)}`
    : `No channel DNA available â€” score channel fit generically for a true crime documentary audience.`;

  return `You are an investigative documentary producer and YouTube growth strategist for a true crime channel. For the case "${caseName}", produce a full production brief.

CASE SUMMARY:
${summary}

${findingsBlock}

${coverageBlock}

${channelBlock}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "caseWriteup": string (3-4 sentence narrative writeup of the case grounded strictly in the summary and latest developments above â€” written like a producer's brief, not a Wikipedia recap),
  "titleIdeas": string[] (8-10 REAL, publishable YouTube titles for this case, each built using a proven formula observed in the top-performing coverage titles above â€” vary the formulas used: question hooks, numbered/countdown structure, "The Truth About X", colon-split dramatic statements, name+shocking detail. Do not just restate angle titles â€” these are click-optimized titles a creator could upload today),
  "angles": [
    {
      "title": string (a compelling angle title),
      "coreQuestion": string (the single question this angle answers),
      "whyItWorks": string (2 concise sentences: why this is underexplored, why it's a fresh entry point),
      "researchFocus": string[] (4-5 specific research directions grounded in the case summary),
      "openingHook": string (one narrator sentence to open the episode),
      "channelFit": string (2 sentences: specifically why this angle suits THIS channel's established style/audience per the Channel DNA above â€” be concrete, not generic),
      "whyWorkOnIt": string (2 sentences: the concrete case for prioritizing this angle now â€” freshness, timeliness given latest developments, competitive gap),
      "curiosityGaps": string[] (3-4 specific unresolved questions or missing pieces of information that would pull a viewer to watch to the end),
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

Generate between 6 and 8 angles. Keep every field concise â€” this response must complete in full within token limits. Score each angle honestly and distinctly. Order angles by total score descending. Ground everything strictly in the case summary and findings provided â€” never invent facts. Return ONLY the JSON object.`;
}

function tryParseJson(text: string): Partial<ParsedResponse> | null {
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

function extractStringArrayField(text: string, key: string): string[] {
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
        if (parsed && Array.isArray(parsed.v)) return parsed.v as string[];
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
        titleIdeas: parsed.titleIdeas ?? [],
      };
    }
  }

  const salvagedAngles = salvageTruncatedAngles(fromFirstBrace);
  if (salvagedAngles.length > 0) {
    return {
      angles: salvagedAngles,
      caseWriteup: extractStringField(fromFirstBrace, "caseWriteup"),
      titleIdeas: extractStringArrayField(fromFirstBrace, "titleIdeas"),
    };
  }

  throw new Error("unparseable_response");
}

async function generateAngleBatch(
  caseName: string,
  summary: string,
  youtubeVideos: YouTubeVideoDetail[],
  findings: SearchResult[],
  channelDNA: ChannelDNA | null
): Promise<ParsedResponse> {
  const raw = await groqProvider.generateText(
    buildPrompt(caseName, summary, youtubeVideos, findings, channelDNA),
    { temperature: 0.7, maxTokens: 5500 }
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
    .select("name, summary")
    .eq("id", caseId)
    .single();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: caseError?.message ?? "Case not found" }, { status: 404 });
  }

  if (!caseRow.summary) {
    return NextResponse.json(
      { error: "This case hasn't been researched yet â€” no summary available to build an angle from" },
      { status: 400 }
    );
  }

  const youtubeVideos = await getOrFetchYouTubeCoverage(caseId, caseRow.name).catch(() => []);

  const findings = tavilyProvider.isConfigured()
    ? await tavilyProvider.search(`${caseRow.name} case latest update trial news`, 8).catch(() => [])
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
    parsed = await generateAngleBatch(caseRow.name, caseRow.summary, youtubeVideos, findings, channelDNA);
  } catch (firstErr) {
    try {
      parsed = await generateAngleBatch(caseRow.name, caseRow.summary, youtubeVideos, findings, channelDNA);
    } catch (secondErr) {
      console.error("generate-angle: both attempts failed", firstErr, secondErr);
      return NextResponse.json(
        {
          error:
            "We couldn't generate angles for this case just now â€” the response came back incomplete. Please try again.",
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
      latest_findings: latestFindings,
      title_ideas: parsed.titleIdeas,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("angles")
      .insert(rowsToInsert)
      .select(
        "id, title, core_question, why_it_works, research_focus, opening_hook, scores, script, script_generated_at, case_writeup, channel_fit, why_work_on_it, curiosity_gaps, latest_findings, title_ideas"
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
      latestFindings: row.latest_findings ?? [],
      titleIdeas: row.title_ideas ?? [],
    }));

    return NextResponse.json({ angles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate angle" },
      { status: 500 }
    );
  }
}