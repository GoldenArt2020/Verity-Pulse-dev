import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

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
  return words.length === 1 && words[0].length >= 15;
}

/**
 * Shared core: validates the name, checks for an existing case
 * case-insensitively, creates a stub if none exists. Takes an already-
 * constructed Supabase client so the caller controls whether that's a
 * browser client (user's own session/cookies) or a server client
 * (request-scoped session) — this function itself doesn't know or care
 * which, so the same dedup/validation logic can't drift between the two
 * call paths.
 */
async function getOrCreateCaseCore(supabase: SupabaseClient, name: string): Promise<CaseStub> {
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

/**
 * Client-side entry point — unchanged behavior from before, still uses
 * the browser Supabase client internally. Existing callers keep working
 * exactly as they did.
 */
export async function getOrCreateCase(name: string): Promise<CaseStub> {
  const supabase = createBrowserClient();
  return getOrCreateCaseCore(supabase, name);
}

/**
 * Server-side entry point — takes an already-constructed server Supabase
 * client (from `@/lib/supabase/server`'s `createClient()`, which is
 * request-scoped and cookie-aware) rather than building its own. Use this
 * from API routes; using the browser-client version there would run
 * without the right session context.
 */
export async function getOrCreateCaseServer(supabase: SupabaseClient, name: string): Promise<CaseStub> {
  return getOrCreateCaseCore(supabase, name);
}