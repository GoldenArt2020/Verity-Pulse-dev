import { task } from "@trigger.dev/sdk";
import { generateScriptSingleCall, type ValidWordCount } from "@/services/claudeScriptWriter";
import { completeGeneration, failGeneration } from "@/lib/entitlements";
import { createServiceClient } from "@/lib/supabase/service";

interface WriteScriptPayload {
  angleId: string;
  caseId: string;
  wordCount: ValidWordCount;
  userId: string;
  generationId: string;
}

/**
 * Runs the full script pipeline (research → outline → sections →
 * finalize, reusing generateScript()'s existing orchestration) inside a
 * Trigger.dev task instead of across separate Vercel API calls. This is
 * what removes the 60s-per-request pressure that originally forced
 * section-by-section client-driven polling — Trigger tasks get up to
 * 3600s (see trigger.config.ts maxDuration), so the whole thing can now
 * run as one continuous background job.
 */
export const writeScript = task({
  id: "write-script",
  maxDuration: 3600,
  run: async (payload: WriteScriptPayload) => {
    const startedAt = Date.now();
    const supabase = createServiceClient();
    try {
      const { script, usage } = await generateScriptSingleCall(
        payload.angleId,
        payload.caseId,
        payload.wordCount,
        payload.userId,
        supabase
      );

      await completeGeneration(
        payload.generationId,
        {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheCreationInputTokens: usage.cacheCreationInputTokens,
          cacheReadInputTokens: usage.cacheReadInputTokens,
          durationMs: Date.now() - startedAt,
          estimatedCostUsd: usage.estimatedCostUsd,
        },
        supabase
      );

      const wordCount = script.split(/\s+/).filter(Boolean).length;
      return { script, wordCount };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Script generation failed";
      await failGeneration(payload.generationId, payload.userId, message, createServiceClient());
      throw err;
    }
  },
});