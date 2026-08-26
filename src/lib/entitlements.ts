import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReservationResult {
  ok: boolean;
  reason?: string;
  generationId?: string;
}

/**
 * Server-side entitlement check + atomic credit reservation. This is the
 * ONLY gate that matters — never trust any "isPaid"/"credits" value the
 * client sends. Everything here is read fresh from the database against
 * the authenticated session's user_id, which itself comes from the
 * server-verified Supabase session, not from the request body.
 *
 * Idempotency: if idempotencyKey matches an existing generation row
 * (e.g. a double-click resubmitted the same request while the first was
 * still in flight), returns that existing reservation instead of
 * consuming a second credit.
 *
 * Race safety: the credit decrement uses `.gt("credits", 0)` as part of
 * the UPDATE's WHERE clause, so two concurrent requests can't both
 * succeed off a stale read — only one UPDATE can actually match and
 * decrement; the loser gets zero rows back and is correctly rejected.
 */
export async function checkAndReserveGeneration(
  userId: string,
  wordCount: number,
  idempotencyKey: string,
  context: { angleId?: string; caseId?: string }
): Promise<ReservationResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("script_generations")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      reason: existing.status === "complete" ? "This generation has already completed." : "This generation is already in progress.",
    };
  }

  const { data: entitlement, error: entError } = await supabase
    .from("user_entitlements")
    .select("is_active, credits, unlimited")
    .eq("user_id", userId)
    .maybeSingle();

  if (entError || !entitlement || !entitlement.is_active) {
    return { ok: false, reason: "Script generation requires an active paid plan." };
  }

  if (!entitlement.unlimited) {
    const { data: decremented, error: decError } = await supabase
      .from("user_entitlements")
      .update({ credits: entitlement.credits - 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("credits", entitlement.credits)
      .gt("credits", 0)
      .select("credits")
      .maybeSingle();

    if (decError || !decremented) {
      return { ok: false, reason: "You've used all your script generation credits." };
    }
  }

  const { data: reservation, error: resError } = await supabase
    .from("script_generations")
    .insert({
      user_id: userId,
      angle_id: context.angleId ?? null,
      case_id: context.caseId ?? null,
      requested_word_count: wordCount,
      model: process.env.ANTHROPIC_SCRIPT_MODEL ?? "claude-sonnet-5",
      status: "reserved",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (resError || !reservation) {
    if (!entitlement.unlimited) {
      // Reservation failed after we already took the credit — refund it.
      await supabase.from("user_entitlements").update({ credits: entitlement.credits }).eq("user_id", userId);
    }
    return { ok: false, reason: "Failed to reserve generation slot. Please try again." };
  }

  return { ok: true, generationId: reservation.id };
}

export async function completeGeneration(
  generationId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    durationMs: number;
    estimatedCostUsd: number;
  },
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient ?? (await createClient());
  await supabase
    .from("script_generations")
    .update({
      status: "complete",
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cache_creation_input_tokens: usage.cacheCreationInputTokens ?? null,
      cache_read_input_tokens: usage.cacheReadInputTokens ?? null,
      duration_ms: usage.durationMs,
      estimated_cost_usd: usage.estimatedCostUsd,
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationId);
}

/** A failed generation refunds the credit — the user shouldn't lose a
 * credit for a Claude API error or timeout that produced nothing usable. */
export async function failGeneration(
  generationId: string,
  userId: string,
  errorMessage: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient ?? (await createClient());
  await supabase
    .from("script_generations")
    .update({ status: "failed", error: errorMessage, completed_at: new Date().toISOString() })
    .eq("id", generationId);

  const { data: entitlement } = await supabase
    .from("user_entitlements")
    .select("credits, unlimited")
    .eq("user_id", userId)
    .maybeSingle();

  if (entitlement && !entitlement.unlimited) {
    await supabase.from("user_entitlements").update({ credits: entitlement.credits + 1 }).eq("user_id", userId);
  }
}