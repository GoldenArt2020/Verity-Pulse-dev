import { createClient } from "@/lib/supabase/server";
import { tavilyProvider } from "@/providers/search/tavilyProvider";
import { groqProvider } from "@/providers/ai/groqProvider";
import type { SearchResult } from "@/providers/search/types";
import { formatSourcesWithReliability } from "@/lib/sourceReliability";

export interface BackgroundProfile {
  name: string;
  role: string;
  background: string;
  dailyLife: string;
  personality: string;
  relationships: string;
  lastKnownActivities: string;
  sourceNote: string | null;
}

interface CaseFactsPerson {
  name: string;
  role: string;
  details: string;
}

const PROFILE_ROLE_PATTERN = /victim|suspect|accused|killer|defendant|perpetrator|convicted/i;

function selectProfileCandidates(people: CaseFactsPerson[]): CaseFactsPerson[] {
  return people.filter((p) => PROFILE_ROLE_PATTERN.test(p.role)).slice(0, 5);
}

async function gatherPersonSources(caseName: string, person: CaseFactsPerson): Promise<SearchResult[]> {
  const queries = [
    `"${person.name}" ${caseName} who was background`,
    `"${person.name}" life before ${caseName}`,
  ];
  const batches = await Promise.all(
    queries.map((q) => tavilyProvider.search(q, 5).catch(() => [] as SearchResult[]))
  );
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const batch of batches) {
    for (const r of batch) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      merged.push(r);
    }
  }
  return merged;
}

function buildBackgroundPrompt(
  caseName: string,
  bundles: { person: CaseFactsPerson; sourcesText: string }[]
): string {
  const peopleBlock = bundles
    .map(
      ({ person, sourcesText }, i) => `PERSON ${i + 1}: ${person.name} (role: ${person.role})
Already known: ${person.details}
SOURCE MATERIAL FOUND FOR THIS PERSON:
${sourcesText || "No additional source material was found beyond what's already known."}`
    )
    .join("\n\n---\n\n");

  return `You are a documentary researcher building humanizing life-context profiles for a true crime script about "${caseName}". For each person below, write a profile grounded STRICTLY in the source material provided — never invent biographical detail that isn't stated or strongly implied by the sources.

${peopleBlock}

Return ONLY a valid JSON array (no markdown, no commentary), one object per person, in the same order, matching this exact shape:

[
  {
    "name": string,
    "role": string,
    "background": string (2-3 sentences: upbringing, occupation, where they lived — whatever the sources establish),
    "dailyLife": string (2-3 sentences: what an ordinary day looked like for them — routine, work, family life — enough concrete detail that a narrator could paint a scene, but only from what sources support),
    "personality": string (1-2 sentences: character traits, how people who knew them described them, if sources say),
    "relationships": string (1-2 sentences: key relationships — family, friends, romantic — relevant to the case),
    "lastKnownActivities": string (1-2 sentences: what they were doing or where they were in the period immediately before the incident, if sources cover this),
    "sourceNote": string or null (if source material for this person was thin, say so plainly here, e.g. "Limited public information is available beyond court records" — do not pad the fields above with speculation to compensate)
  }
]

Every field must be traceable to the source material given. If a field has no supporting information, write "Not established in available sources" for that field rather than guessing. Return ONLY the JSON array.`;
}

function parseProfiles(raw: string): BackgroundProfile[] {
  let cleaned = raw.trim().replace(/```json/gi, "").replace(/```/g, "");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error(`No JSON array found in background research response: ${raw.slice(0, 200)}`);
  }
  cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  return JSON.parse(cleaned);
}

/**
 * Second-pass research, run automatically right after runCaseResearch has
 * produced caseFacts.people. Targets named victims/suspects specifically
 * and builds a humanizing daily-life profile for each — background,
 * ordinary routine, personality, relationships, and last known activities —
 * grounded strictly in what's publicly reported. Feeds both the Selected
 * Angle panel and script generation, since this is exactly the texture that
 * makes a script land emotionally instead of reading like a police blotter.
 *
 * Non-fatal by design: if this fails, the primary case research (name,
 * summary, case_facts) has already succeeded and been saved, so a
 * background-research failure should never surface as a research error to
 * the user — it just means the case proceeds without background profiles.
 * SERVER-ONLY.
 */
export async function runBackgroundResearch(
  caseId: string,
  caseName: string,
  people: CaseFactsPerson[]
): Promise<BackgroundProfile[]> {
  const candidates = selectProfileCandidates(people ?? []);
  if (candidates.length === 0) return [];
  if (!tavilyProvider.isConfigured() || !groqProvider.isConfigured()) return [];

  const bundles = await Promise.all(
    candidates.map(async (person) => {
      const sources = await gatherPersonSources(caseName, person);
      return { person, sourcesText: sources.length > 0 ? formatSourcesWithReliability(sources, 600) : "" };
    })
  );

  const raw = await groqProvider.generateText(buildBackgroundPrompt(caseName, bundles), {
    temperature: 0.3,
    maxTokens: 3000,
  });

  const profiles = parseProfiles(raw);

  const supabase = await createClient();
  const { error } = await supabase.from("cases").update({ background_profiles: profiles }).eq("id", caseId);
  if (error) {
    console.error("Failed to save background profiles:", error.message);
  }

  return profiles;
}