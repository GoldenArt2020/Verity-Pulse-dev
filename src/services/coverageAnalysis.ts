import { createClient } from "@/lib/supabase/server";
import { gorouterFastProvider as groqProvider } from "@/providers/ai/gorouterProvider";

export interface CoverageMapItem { angle: string; coverage: number }
export interface AngleSaturationRow { angle: string; coverage: number; opportunity: number }
export interface UntappedAngle {
  title: string;
  opportunityScore: number;
  coverage: number;
  why: string;
  questions: string[];
  originality: string;
  evidenceStrength: string;
  audienceMatch: number;
}
export interface EditorialFeedbackData {
  videosAnalyzed: number;
  points: string[];
  conclusion: string;
}
export interface CoverageIntelligence {
  coverageMap: CoverageMapItem[];
  angleSaturation: AngleSaturationRow[];
  untappedAngles: UntappedAngle[];
  editorialFeedback: EditorialFeedbackData;
  generatedAt: string;
}

const LENS_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

function buildPrompt(caseName: string, summary: string, titles: string[]): string {
  const list =
    titles.length > 0
      ? titles.map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "No YouTube videos found for this case.";

  return `You are an editorial coverage analyst for a true crime YouTube platform. For the case "${caseName}", analyze how existing YouTube videos cover it and identify gaps.

CASE SUMMARY:
${summary}

EXISTING YOUTUBE VIDEO TITLES (${titles.length} found):
${list}

Return ONLY valid JSON (no markdown) matching exactly:
{
  "coverageMap": [{ "angle": "victim-centered"|"investigative"|"systemic-failure"|"family-impact"|"courtroom", "coverage": number (0-100) }],
  "untappedAngles": [
    {
      "angle": "victim-centered"|"investigative"|"systemic-failure"|"family-impact"|"courtroom",
      "title": string,
      "opportunityScore": number (0-100),
      "why": string (2-3 sentences, grounded in the case summary and what's missing from existing titles),
      "questions": string[] (3-5 documentary questions),
      "originality": "Low"|"Medium"|"High"|"Very High",
      "evidenceStrength": "Low"|"Medium"|"High",
      "audienceMatch": number (0-100)
    }
  ],
  "editorialSummary": string (2-3 sentences, experienced documentary editor tone, referencing the actual coverage numbers)
}

Include all 5 lens categories in "coverageMap" even if 0. Only include lenses below 40% coverage in "untappedAngles", ordered by opportunityScore descending. If 0 YouTube titles, set all coverage to 0 and treat every lens as untapped. Return ONLY the JSON object.`;
}

function parseResponse(raw: string): any {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error("No JSON found in AI response");
  return JSON.parse(cleaned.slice(a, b + 1));
}

export async function getOrBuildCoverageIntelligence(
  caseId: string,
  caseName: string,
  summary: string,
  youtubeTitles: string[],
  cached: CoverageIntelligence | null
): Promise<CoverageIntelligence> {
  if (cached) return cached;

  if (!groqProvider.isConfigured()) {
    throw new Error("Groq is not configured");
  }

  const raw = await groqProvider.generateText(buildPrompt(caseName, summary, youtubeTitles), {
    temperature: 0.4,
    maxTokens: 1800,
  });

  const parsed = parseResponse(raw);

  const coverageMap: CoverageMapItem[] = (parsed.coverageMap ?? []).map((c: any) => ({
    angle: LENS_LABELS[c.angle] ?? c.angle,
    coverage: c.coverage ?? 0,
  }));

  const angleSaturation: AngleSaturationRow[] = coverageMap.map((c) => {
    const match = (parsed.untappedAngles ?? []).find(
      (u: any) => (LENS_LABELS[u.angle] ?? u.angle) === c.angle
    );
    return {
      angle: c.angle,
      coverage: c.coverage,
      opportunity: match?.opportunityScore ?? Math.max(0, 100 - c.coverage),
    };
  });

  const untappedAngles: UntappedAngle[] = (parsed.untappedAngles ?? []).map((u: any) => ({
    title: u.title,
    opportunityScore: u.opportunityScore,
    coverage: coverageMap.find((c) => c.angle === (LENS_LABELS[u.angle] ?? u.angle))?.coverage ?? 0,
    why: u.why,
    questions: u.questions ?? [],
    originality: u.originality,
    evidenceStrength: u.evidenceStrength,
    audienceMatch: u.audienceMatch,
  }));

  const editorialFeedback: EditorialFeedbackData = {
    videosAnalyzed: youtubeTitles.length,
    points: coverageMap
      .filter((c) => c.coverage > 0)
      .sort((a, b) => b.coverage - a.coverage)
      .map((c) => `${c.coverage}% of coverage focused on ${c.angle}.`),
    conclusion: parsed.editorialSummary ?? "",
  };

  const result: CoverageIntelligence = {
    coverageMap,
    angleSaturation,
    untappedAngles,
    editorialFeedback,
    generatedAt: new Date().toISOString(),
  };

  const supabase = await createClient();
  await supabase.from("cases").update({ coverage_intelligence: result }).eq("id", caseId);

  return result;
}