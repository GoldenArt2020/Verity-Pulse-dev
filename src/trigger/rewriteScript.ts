import { task } from "@trigger.dev/sdk";
import { rewriteScriptSingleCall } from "@/services/claudeScriptWriter";
import { completeGeneration, failGeneration } from "@/lib/entitlements";
import { createServiceClient } from "@/lib/supabase/service";

interface RewriteScriptPayload {
  angleId: string;
  caseId: string;
  critique: string;
  userId: string;
  generationId: string;
}

export const rewriteScript = task({
  id: "rewrite-script",
  maxDuration: 3600,
  run: async (payload: RewriteScriptPayload) => {
    const startedAt = Date.now();
    const supabase = createServiceClient();
    try {
      // Read the latest script so a stale client copy cannot overwrite newer work.
      const { data: angleRow, error: angleError } = await supabase
        .from("angles")
        .select("script")
        .eq("id", payload.angleId)
        .single();

      if (angleError || !angleRow?.script) {
        throw new Error(`No existing script found to rewrite: ${angleError?.message ?? "script is empty"}`);
      }

      const { script, usage, verificationIssues } = await rewriteScriptSingleCall(
        payload.angleId,
        payload.caseId,
        angleRow.script,
        payload.critique,
        payload.userId,
        supabase
      );
      const wordCount = script.split(/\s+/).filter(Boolean).length;

      const { data: savedAngle, error: saveError } = await supabase
        .from("angles")
        .update({
          script,
          script_previous: angleRow.script,
          script_generated_at: new Date().toISOString(),
          script_word_count: wordCount,
          active_script_run_id: null,
          verification_issues: verificationIssues ?? [],
        })
        .eq("id", payload.angleId)
        .select("id")
        .single();

      if (saveError || !savedAngle) {
        throw new Error(`Failed to save rewritten script: ${saveError?.message ?? "update affected no rows"}`);
      }

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

      return { script, wordCount, verificationIssues };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Script rewrite failed";
      await failGeneration(payload.generationId, payload.userId, message, createServiceClient());
      throw err;
    }
  },
});
