import { task } from "@trigger.dev/sdk";
import { editScriptSingleCall } from "@/services/claudeScriptWriter";
import { completeGeneration, failGeneration } from "@/lib/entitlements";
import { createServiceClient } from "@/lib/supabase/service";

interface EditInstruction {
  find: string;
  instruction: string;
}

interface EditScriptPayload {
  angleId: string;
  edits: EditInstruction[];
  userId: string;
  generationId: string;
}

export const editScript = task({
  id: "edit-script",
  maxDuration: 900,
  run: async (payload: EditScriptPayload) => {
    const startedAt = Date.now();
    const supabase = createServiceClient();
    try {
      const { data: angleRow, error: angleError } = await supabase
        .from("angles")
        .select("script")
        .eq("id", payload.angleId)
        .single();

      if (angleError || !angleRow?.script) {
        throw new Error(`No existing script found to edit: ${angleError?.message ?? "script is empty"}`);
      }

      const { script, usage } = await editScriptSingleCall(payload.angleId, angleRow.script, payload.edits);
      const wordCount = script.split(/\s+/).filter(Boolean).length;

      const { data: savedAngle, error: saveError } = await supabase
        .from("angles")
        .update({
          script,
          script_previous: angleRow.script,
          script_generated_at: new Date().toISOString(),
          script_word_count: wordCount,
          active_script_run_id: null,
        })
        .eq("id", payload.angleId)
        .select("id")
        .single();

      if (saveError || !savedAngle) {
        throw new Error(`Failed to save edited script: ${saveError?.message ?? "update affected no rows"}`);
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

      return { script, wordCount };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Script edit failed";
      await failGeneration(payload.generationId, payload.userId, message, createServiceClient());
      await supabase.from("angles").update({ active_script_run_id: null }).eq("id", payload.angleId);
      throw err;
    }
  },
});
