export const SCRIPT_WORD_COUNT_OPTIONS = [5000, 7000, 10000] as const;
export type ScriptWordCount = (typeof SCRIPT_WORD_COUNT_OPTIONS)[number];

export function isValidScriptWordCount(value: unknown): value is ScriptWordCount {
  return typeof value === "number" && (SCRIPT_WORD_COUNT_OPTIONS as readonly number[]).includes(value);
}