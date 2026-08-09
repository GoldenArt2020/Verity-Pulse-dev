import { createClient } from "@/lib/supabase/client";

export interface CaseStub {
  id: string;
  name: string;
}

/**
 * Rejects case names too vague/incomplete to search or research meaningfully
 * — e.g. a bare first name like "Adriann" with no surname or case
 * descriptor. A name this vague produces noisy, loosely-related search
 * results once research/angle generation runs on it, which has caused
 * fabricated-sounding "connections" to be drawn between this case and
 * unrelated real events (the model technically grounding itself in
 * genuinely irrelevant search hits, since the case name gave it nothing
 * specific to search for). Better to reject at creation time than let a
 * bad name propagate through research, angles, and scripts.
 */
function isValidCaseName(name: string): boolean {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return true;
  // Allow a single "word" only if it's a substantial descriptive phrase
  // some other way (rare, but avoids false-rejecting edge cases) —
  // otherwise a single bare token (a first name, an initial, etc.) is too
  // vague to be a real case identifier.
  return words.length === 1 && words[0].length >= 15;
}

/**
 * Returns the existing Case row for this name if one exists (case-insensitive),
 * otherwise creates a minimal stub row and returns it.
 * Client-safe — no secrets involved, just an RLS-protected DB write.
 */
export async function getOrCreateCase(name: string): Promise<CaseStub> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user in getOrCreateCase:", user);
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Case name is required");
  }

  if (!isValidCaseName(trimmedName)) {
    throw new Error(
      `"${trimmedName}" isn't a specific enough case name to research (looks like a fragment, not a full case name). This recommendation may need to be regenerated.`
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("cases")
    .select("id, name")
    .ilike("name", trimmedName)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to check for existing case: ${fetchError.message}`);
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("cases")
    .insert({
      name: trimmedName,
      status: "UNSOLVED",
      last_updated: new Date().toISOString(),
    })
    .select("id, name")
    .single();

  if (insertError) {
    throw new Error(`Failed to create case: ${insertError.message}`);
  }

  return created;
}