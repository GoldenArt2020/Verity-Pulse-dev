import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";
import { getOrFetchYouTubeCoverage } from "@/services/youtubeCoverage";

export interface AngleScores {
  searchDemand: number;
  competition: number;
  emotionalImpact: number;
  originality: number;
  audienceMatch: number;
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
}

interface RawAngle {
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
}

function buildPrompt(caseName: string, summary: string, youtubeTitles: string[]): string {
  const coverageBlock =
    youtubeTitles.length > 0
      ? `EXISTING YOUTUBE COVERAGE (titles already published on this case):\n${youtubeTitles
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}`
      : `No existing YouTube coverage data is available for this case.`;

  return `You are an investigative documentary producer for a true crime YouTube channel. For the case "${caseName}", generate narrative angles that avoid the generic "here's what happened" structure most true crime videos use.

Each angle must be built around a CENTRAL QUESTION the documentary answers, not a chronological recap. Angles should surface a perspective existing coverage ignores or barely touches.

CASE SUMMARY:
${summary}

${coverageBlock}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "angles": [
    {
      "title": string (a compelling angle title, e.g. "The Fire Was Never the Crime; It Was the Cover-Up"),
      "coreQuestion": string (the single question this angle answers, e.g. "Why was the house set on fire, and how did that decision work against the killer?"),
      "whyItWorks": string (2-3 sentences: why this is underexplored in existing coverage, and why it creates a fresh entry point into the case),
      "researchFocus": string[] (4-6 specific, concrete research directions — facts, records, or evidence types to investigate for this angle, grounded in the case summary, not generic),
      "openingHook": string (one sentence a narrator would use to open the episode on this angle, phrased as a question or a striking statement),
      "scores": {
        "searchDemand": number (0-25, how likely this specific angle is to match rising search interest, reasoned from how distinctive/newsworthy this specific question is),
        "competition": number (0-20, higher = LESS saturated on YouTube for this angle — base this on the existing coverage list; if no coverage data exists, score conservatively at 10),
        "emotionalImpact": number (0-25, how emotionally resonant this specific angle is, grounded in the actual case facts),
        "originality": number (0-15, how distinct this angle is from the other angles generated and from existing coverage),
        "audienceMatch": number (0-15, general true-crime audience appeal for this specific angle; score at 8 if uncertain)
      }
    }
  ]
}

Generate between 6 and 10 angles. Do not repeat the same core question in different words. Score each angle honestly and distinctly — do not give every angle the same scores. Order angles by total score (sum of all 5 score fields) descending. Ground every angle strictly in the case summary provided — do not invent facts not implied by it. Return ONLY the JSON object.`;
}

function parseAngles(raw: string): RawAngle[] {
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

    const raw = await groqProvider.generateText(
      buildPrompt(caseRow.name, caseRow.summary, youtubeTitles),
      { temperature: 0.7, maxTokens: 2600 }
    );
    const rawAngles = parseAngles(raw);

    if (rawAngles.length === 0) {
      return NextResponse.json({ error: "No angles were generated" }, { status: 500 });
    }

    // Archive the previous active batch rather than deleting — archived
    // angles (and any scripts already written against them) stay saved
    // under the case's project, they just stop showing as "current."
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

    const rowsToInsert = rawAngles.map((a) => ({
      case_id: caseId,
      title: a.title,
      core_question: a.coreQuestion,
      why_it_works: a.whyItWorks,
      research_focus: a.researchFocus,
      opening_hook: a.openingHook,
      scores: a.scores,
      status: "active",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("angles")
      .insert(rowsToInsert)
      .select("id, title, core_question, why_it_works, research_focus, opening_hook, scores, script, script_generated_at");

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
    }));

    return NextResponse.json({ angles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate angle" },
      { status: 500 }
    );
  }
}