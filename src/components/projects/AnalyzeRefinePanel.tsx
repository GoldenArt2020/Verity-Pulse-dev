"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, Sparkles, AlertTriangle, RotateCcw, FileText } from "lucide-react";

interface VerificationIssue {
  claim: string;
  problem: string;
}

interface AnalyzeRefinePanelProps {
  angleId: string;
  caseId: string;
  script: string | null;
  scriptPrevious: string | null;
  verificationIssues?: VerificationIssue[] | null;
  onScriptUpdated: (script: string, scriptPrevious: string | null, verificationIssues: VerificationIssue[]) => void;
  onViewScript: () => void;
}

type PollResult = {
  status: string;
  script?: string;
  wordCount?: number;
  error?: string;
};

const POLL_INTERVAL_MS = 4000;
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

export function AnalyzeRefinePanel({
  angleId,
  caseId,
  script,
  scriptPrevious,
  verificationIssues,
  onScriptUpdated,
  onViewScript,
}: AnalyzeRefinePanelProps) {
  const [critique, setCritique] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);
  const [edits, setEdits] = useState<{ find: string; instruction: string }[]>([
    { find: "", instruction: "" },
  ]);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const activeRef = useRef(true);

  const pollRun = useCallback(async (runId: string): Promise<PollResult> => {
    let result: PollResult = { status: "in_progress" };
    let consecutiveErrors = 0;

    do {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      try {
        const statusRes = await fetch(`/api/scripts/status/${runId}`);
        const json = await statusRes.json();
        if (!statusRes.ok) throw new Error(json.error ?? "Failed to check rewrite status");
        result = json;
        consecutiveErrors = 0;
      } catch (pollErr) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
          throw pollErr instanceof Error ? pollErr : new Error("Failed to check rewrite status");
        }
        result = { status: "in_progress" };
      }
    } while (result.status === "in_progress");

    return result;
  }, []);

  async function handleRewrite() {
    if (!critique.trim() || !script) return;
    setError(null);
    setRewriting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/scripts/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId, caseId, critique, idempotencyKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to start rewrite");

      const result = await pollRun(data.runId);
      if (result.status === "failed") throw new Error(result.error ?? "Rewrite failed");
      if (result.status !== "complete" || !result.script) throw new Error("Rewrite returned no script");

      if (activeRef.current) {
        onScriptUpdated(result.script, script, []);
        setCritique("");
      }
    } catch (err) {
      if (activeRef.current) setError(err instanceof Error ? err.message : "Failed to rewrite script");
    } finally {
      if (activeRef.current) setRewriting(false);
    }
  }

  async function handleRevert() {
    if (!scriptPrevious) return;
    setReverting(true);
    setError(null);
    try {
      const res = await fetch(`/api/angle/${angleId}/revert-script`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to revert script");
      onScriptUpdated(data.script, null, []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revert script");
    } finally {
      setReverting(false);
    }
  }

  function updateEdit(index: number, field: "find" | "instruction", value: string) {
    setEdits((previous) => previous.map((edit, editIndex) =>
      editIndex === index ? { ...edit, [field]: value } : edit
    ));
  }

  function addEditRow() {
    setEdits((previous) => [...previous, { find: "", instruction: "" }]);
  }

  function removeEditRow(index: number) {
    setEdits((previous) => previous.filter((_, editIndex) => editIndex !== index));
  }

  async function handleApplyEdits() {
    const validEdits = edits.filter((edit) => edit.find.trim() && edit.instruction.trim());
    if (!validEdits.length || !script) return;
    setEditError(null);
    setEditing(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/scripts/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId, caseId, edits: validEdits, idempotencyKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to start edit");

      const result = await pollRun(data.runId);
      if (result.status === "failed") throw new Error(result.error ?? "Edit failed");
      if (result.status !== "complete" || !result.script) throw new Error("Edit returned no script");

      onScriptUpdated(result.script, script, []);
      setEdits([{ find: "", instruction: "" }]);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to apply edits");
    } finally {
      setEditing(false);
    }
  }

  if (!script) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/30 p-8 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-slate-600" />
        <p className="mt-2 text-sm text-slate-500">
          Write a script for this angle first, then come back here to critique and refine it.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Current Script</h3>
          </div>
          <button onClick={onViewScript} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View full script
          </button>
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-slate-400">{script.slice(0, 220)}...</p>

        {scriptPrevious && (
          <button
            onClick={handleRevert}
            disabled={reverting}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-60"
          >
            {reverting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Revert to previous version
          </button>
        )}
      </div>

      {verificationIssues && verificationIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">
              {verificationIssues.length} potential factual issue{verificationIssues.length > 1 ? "s" : ""} flagged
            </h3>
          </div>
          <ul className="mt-3 space-y-2">
            {verificationIssues.map((issue, index) => (
              <li key={index} className="text-xs text-amber-100/80">
                <span className="font-medium text-amber-200">{issue.claim}</span>
                <span className="block text-amber-100/60">{issue.problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-sm font-semibold text-white">Precise Edits</h3>
        <p className="mt-1 text-xs text-slate-500">
          Paste the exact text to change and what to do with it. Everything else in the script stays untouched.
        </p>

        <div className="mt-3 space-y-3">
          {edits.map((edit, index) => (
            <div key={index} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <textarea
                value={edit.find}
                onChange={(event) => updateEdit(index, "find", event.target.value)}
                disabled={editing}
                rows={2}
                placeholder="Text to find (paste the exact sentence or passage)..."
                className="w-full rounded-lg border border-slate-800/60 bg-slate-900/60 p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none disabled:opacity-60"
              />
              <textarea
                value={edit.instruction}
                onChange={(event) => updateEdit(index, "instruction", event.target.value)}
                disabled={editing}
                rows={2}
                placeholder="What to do with it (e.g. 'make this punchier', 'cut this line', 'replace with...')..."
                className="mt-2 w-full rounded-lg border border-slate-800/60 bg-slate-900/60 p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none disabled:opacity-60"
              />
              {edits.length > 1 && (
                <button
                  onClick={() => removeEditRow(index)}
                  disabled={editing}
                  className="mt-2 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addEditRow}
          disabled={editing}
          className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-60"
        >
          + Add another edit
        </button>

        {editError && <p className="mt-2 text-xs text-rose-400">{editError}</p>}

        <button
          onClick={handleApplyEdits}
          disabled={editing || !edits.some((edit) => edit.find.trim() && edit.instruction.trim())}
          className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {editing ? "Applying edits..." : "Apply Edits"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <h3 className="text-sm font-semibold text-white">Critique & Rewrite</h3>
        <p className="mt-1 text-xs text-slate-500">
          Paste feedback, fact-check notes, or editorial critique below. The rewrite will apply corrections
          grounded in this angle&apos;s research.
        </p>
        <textarea
          value={critique}
          onChange={(event) => setCritique(event.target.value)}
          disabled={rewriting}
          rows={8}
          placeholder="Paste your critique or fact-check notes here..."
          className="mt-3 w-full rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none disabled:opacity-60"
        />
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
        <button
          onClick={handleRewrite}
          disabled={rewriting || !critique.trim()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          {rewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {rewriting ? "Rewriting — this can take a few minutes..." : "Rewrite Script"}
        </button>
      </div>
    </div>
  );
}
