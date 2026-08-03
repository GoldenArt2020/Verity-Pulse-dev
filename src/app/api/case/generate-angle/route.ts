import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/providers/ai/groqProvider";

const ANGLE_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

interface GeneratedAngle {
  title: string;
  hook: string;
  rationale: string;
  keyBeats: string[];
}

function buildAnglePrompt(
  caseName: string,
  summary: string,
  angleLabel: string
): string {
  return `You are an editorial producer for a true crime YouTube documentary channel. For the case "${caseName}", generate ONE specific documentary angle using a "${angleLabel}" lens.

CASE SUMMARY:
${summary}

Return ONLY valid JSON (no markdown, no commentary) matching this exact shape:

{
  "title": string (a compelling episode/angle title, max 12 words),
  "hook": string (a single punchy sentence that would open the episode, written in narrator voice),
  "rationale": string (2-3 sentences explaining why this angle works for THIS case specifically, grounded in the summary — not generic advice),
  "keyBeats": string[] (4-6 short specific story beats or sequences this angle would cover, drawn from the case facts)
}

Return ONLY the JSON object.`;
}

function parseAngle(raw: string): GeneratedAngle {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON object found in AI response: ${raw.slice(0, 200)}`);
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse AI JSON response: ${(err as Error).message}\nRaw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}

/**
 * POST /api/case/generate-angle
 * Body: { caseId: string, angleType: string }
 * Generates a single documentary angle pitch for a case, using the
 * case's existing summary (from prior research) as grounding context.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const caseId = body?.caseId as string | undefined;
  const angleType = body?.angleType as string | undefined;

  if (!caseId || !angleType) {
    return NextResponse.json({ error: "caseId and angleType are required" }, { status: 400 });
  }

  const angleLabel = ANGLE_LABELS[angleType];
  if (!angleLabel) {
    return NextResponse.json({ error: "Unknown angleType" }, { status: 400 });
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
    const raw = await groqProvider.generateText(
      buildAnglePrompt(caseRow.name, caseRow.summary, angleLabel),
      { temperature: 0.6, maxTokens: 600 }
    );
    const angle = parseAngle(raw);
    return NextResponse.json(angle);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate angle" },
      { status: 500 }
    );
  }
}