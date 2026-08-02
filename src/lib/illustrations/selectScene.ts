import type { SceneKey } from "./sceneLibrary";
import type { CaseCategory } from "@/components/home/CaseVisual";

interface CaseVisualHints {
  category: CaseCategory;
  /** Free text pulled from the case's researched summary/description */
  description?: string;
}

const KEYWORD_RULES: { pattern: RegExp; scene: SceneKey }[] = [
  { pattern: /forest|woods|trail|hiking|rural/i, scene: "missing-person-forest" },
  { pattern: /street|walked|last seen|station|bus stop|urban/i, scene: "missing-person-street" },
  { pattern: /trial|court|verdict|jury|sentenc/i, scene: "court-case-courtroom" },
  { pattern: /downtown|city|apartment|neighbourhood|neighborhood/i, scene: "unsolved-murder-urban" },
  { pattern: /decades|archive|reopened|cold case|unsolved for/i, scene: "cold-case-archive" },
];

const CATEGORY_DEFAULTS: Record<CaseCategory, SceneKey> = {
  "missing-person": "missing-person-street",
  "unsolved-murder": "unsolved-murder-urban",
  "court-case": "court-case-courtroom",
  "cold-case": "cold-case-archive",
  "general": "general-city",
};

/**
 * Picks the illustrated scene that best fits a case's actual researched content.
 * Keyword rules run first (based on real description text from research),
 * falling back to a sensible default per category if nothing matches.
 */
export function selectScene({ category, description }: CaseVisualHints): SceneKey {
  if (description) {
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(description)) return rule.scene;
    }
  }
  return CATEGORY_DEFAULTS[category] ?? "general-city";
}