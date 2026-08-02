import { createClient } from "@/lib/supabase/client";

export interface CaseStub {
  id: string;
  name: string;
}

/**
 * Returns the existing Case row for this name if one exists (case-insensitive),
 * otherwise creates a minimal stub row and returns it.
 * Client-safe — no secrets involved, just an RLS-protected DB write.
 */
export async function getOrCreateCase(name: string): Promise<CaseStub> {
  const supabase = createClient();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Case name is required");
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