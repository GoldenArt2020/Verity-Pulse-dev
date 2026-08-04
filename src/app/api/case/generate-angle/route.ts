// src/app/api/case/generate-angle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { getOrFetchYouTubeCoverage } from "@/services/youtubeCoverage";
import type { LensPerformance, ChannelDNA } from "@/services/creatorDNA";

const ANGLE_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

export interface AngleScores {
  searchDemand: number;    // 0-25
  competition: number;     // 0-20 (higher = less competition, better)
  emotionalImpact: number; // 0-25
  originality: number;     // 0-15
  audienceMatch: number;   // 0-15
}

interface GeneratedAngle {
  lens: string;
  title: string;
  hook: string;
  rationale: string;
  keyBeats: string[];
  scores: AngleScores;
}

function buildPrompt(
  caseName: string,
  summary: string,
  youtubeTitles: string[],
  lensPerformance: LensPerformance[]
): string {
  const coverageBlock =
    youtubeTitles.length > 0
      ? `EXISTING YOUTUBE COVERAGE for this case (titles already published):\n${youtubeTitles
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}`
      : `No existing YouTube coverage data is available for this case.`;

  const performanceBlock =
    lensPerformance.length > 0
      ? `THIS CREATOR'S HISTORICAL LENS PERFORMANCE (based on their own past videos):\n${lensPerformance
          .map(
            (p) =>
              `- ${ANGLE_LABELS[p.lens] ?? p.lens}: ${p.avgViewsRelativeToChannel} performance (${p.videoCount} past videos in this lens)`
          )
          .join("\n")}`
      : `No historical performance data available for this creator yet.`;

  return `You are an editorial producer for a true crime YouTube documentary channel. For the case "${caseName}", identify which of the 5 documentary lenses below are BOTH underexplored on YouTube for this case AND likely to perform well for this specific creator.

THE 5 LENSES:
- victim-centered: Victim-Centered
- investigative: Investigative Deep-Dive
- systemic-failure: Systemic / Institutional Failure
- family-impact: Family & Community Impact
- courtroom: Legal / Courtroom Drama

CASE SUMMARY:
${summary}

${coverageBlock}

${performanceBlock}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "angles": [
    {
      "lens": string (one of the 5 lens ids above),
      "title": string (a compelling episode/angle title, max 12 words),
      "hook": string (a single punchy sentence that would open the episode, narrator voice),
      "rationale": string (2-3 sentences: why this angle works for THIS case, why it's underexplored on YouTube if coverage data was provided, AND why it fits this creator's proven strengths if performance data was provided),
      "keyBeats": string[] (4-6 short specific story beats drawn from the case facts),
      "scores": {
        "searchDemand": number (0-25, based on how likely this specific angle is to match rising search interest — reason from the case's public profile and how distinctive/newsworthy this specific lens is, not a guess),
        "competition": number (0-20, higher = LESS saturated on YouTube for this lens — base this directly on the existing coverage list above; if no coverage data exists, score conservatively at 10),
        "emotionalImpact": number (0-25, based on how emotionally resonant this specific angle's hook and beats are, grounded in the actual case facts),
        "originality": number (0-15, how distinct this angle is from the other angles you're generating and from the existing YouTube coverage),
        "audienceMatch": number (0-15, based on the creator's historical lens performance data above; if no data exists, score at 8 as neutral)
      }
    }
  ]
}

Only include lenses that are genuinely underexplored for this case — skip any lens that's already saturated in the existing coverage. Prioritize lenses where this creator has "above average" historical performance, but you may still include a strong uncovered lens even without performance data. Score each angle honestly and distinctly — do not give every angle the same scores. Return between 1 and 5 angles, ordered by total score (sum of all 5 score fields) descending. Return ONLY the JSON object.`;
}

function parseAngles(raw: string): GeneratedAngle[] {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.angles ?? [];
  } catch (err) {
    throw new Error(
      `Failed to parse AI JSON response: ${(err as Error).message}\nRaw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  const channelId = body?.channelId as string | undefined;

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
      { error: "This case hasn't been researched yet — no summary available to build an angle from" },
      { status: 400 }
    );
  }

  try {
    const youtubeTitles = await getOrFetchYouTubeCoverage(caseId, caseRow.name);

    let lensPerformance: LensPerformance[] = [];
    if (channelId) {
      const { data: channelRow } = await supabase
        .from("channels")
        .select("channel_dna")
        .eq("youtube_channel_id", channelId)
        .maybeSingle();
      const dna = channelRow?.channel_dna as unknown as ChannelDNA | undefined;
      lensPerformance = dna?.lensPerformance ?? [];
    }

    const raw = await groqProvider.generateText(
      buildPrompt(caseRow.name, caseRow.summary, youtubeTitles, lensPerformance),
      { temperature: 0.6, maxTokens: 1800 }
    );
    const angles = parseAngles(raw);
    return NextResponse.json({ angles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate angle" },
      { status: 500 }
    );
  }
}