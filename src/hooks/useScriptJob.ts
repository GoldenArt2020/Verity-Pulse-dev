"use client";

import { useCallback, useRef, useState } from "react";
import type { ScriptWordCount } from "@/constants/scriptOptions";

export interface ScriptJobProgress {
  sectionsCompleted: number;
  totalSections: number;
}

export interface ScriptJobPreview {
  script: string;
  wordCount: number;
}

interface UseScriptJobOptions {
  angleId: string | null;
  caseId: string;
  hasExistingScript: boolean;
  onComplete: (angleId: string, script: string, wordCount: number) => void;
}

/**
 * Reads a fetch Response as text first, then attempts JSON parsing — a
 * server error (504 timeout, 502, a platform-level error page) often
 * comes back as plain text or HTML, not JSON. Parsing with res.json()
 * directly throws its own confusing SyntaxError in that case ("Unexpected
 * token '<'..." or similar), masking the real problem. This surfaces a
 * readable message either way: the server's own {error} field when
 * present, or a clear status-based fallback when the body isn't JSON at
 * all.
 */
async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body — fall through to the status-based message below.
    }
  }

  if (!res.ok) {
    const message =
      data?.error ??
      (res.status === 504
        ? "That step took too long and timed out. Please try again."
        : res.status === 502
        ? "The server had a temporary problem. Please try again."
        : `Request failed (${res.status}).`);
    throw new Error(message);
  }

  return data as T;
}

/**
 * Drives start -> section(...) -> finish for the entitlements-backed
 * script pipeline (/api/scripts/*), one HTTP request at a time so no
 * single request risks a serverless timeout regardless of script length.
 *
 * Intentionally does NOT auto-resume a job on mount/angle-select. That
 * silent-resume behavior used to fire /api/scripts/active on every visit
 * to an angle and pick back up ANY row still marked "writing" — including
 * one that died mid-request from a platform timeout or dropped
 * connection and never got marked "failed". The result looked like
 * scripts writing themselves unprompted. Writing only ever starts now
 * from an explicit call to start().
 */
export function useScriptJob({ angleId, caseId, onComplete }: UseScriptJobOptions) {
  const [progress, setProgress] = useState<ScriptJobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScriptJobPreview | null>(null);

  const selectedAngleRef = useRef<string | null>(angleId);
  selectedAngleRef.current = angleId;

  const runningAngleRef = useRef<string | null>(null);

  const runLoop = useCallback(
    async (jobId: string, forAngleId: string) => {
      try {
        let status: "writing" | "ready" | "complete" | "failed" = "writing";
        while (status === "writing") {
          if (selectedAngleRef.current !== forAngleId) return; // paused — user navigated away
          const res = await fetch("/api/scripts/section", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
          });
          const data = await parseResponse<{
            status: "writing" | "ready" | "complete" | "failed";
            sectionsCompleted: number;
            totalSections: number;
          }>(res);
          status = data.status;
          if (selectedAngleRef.current === forAngleId) {
            setProgress({ sectionsCompleted: data.sectionsCompleted, totalSections: data.totalSections });
          }
        }

        if (selectedAngleRef.current !== forAngleId) return;
        const finishRes = await fetch("/api/scripts/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const finishData = await parseResponse<{ script: string; wordCount: number }>(finishRes);

        runningAngleRef.current = null;
        onComplete(forAngleId, finishData.script, finishData.wordCount);
        if (selectedAngleRef.current === forAngleId) {
          setProgress(null);
          setPreview({ script: finishData.script, wordCount: finishData.wordCount });
        }
      } catch (err) {
        runningAngleRef.current = null;
        if (selectedAngleRef.current === forAngleId) {
          setProgress(null);
          setError(err instanceof Error ? err.message : "Failed to write script");
        }
      }
    },
    [onComplete]
  );

  const start = useCallback(
    async (forAngleId: string, wordCount: ScriptWordCount) => {
      setError(null);
      setPreview(null);
      runningAngleRef.current = forAngleId;
      if (selectedAngleRef.current === forAngleId) setProgress({ sectionsCompleted: 0, totalSections: 0 });
      try {
        const idempotencyKey = crypto.randomUUID();
        const res = await fetch("/api/scripts/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ angleId: forAngleId, caseId, wordCount, idempotencyKey }),
        });
        const data = await parseResponse<{ jobId: string; totalSections: number }>(res);
        if (selectedAngleRef.current === forAngleId) {
          setProgress({ sectionsCompleted: 0, totalSections: data.totalSections });
        }
        runLoop(data.jobId, forAngleId);
      } catch (err) {
        runningAngleRef.current = null;
        if (selectedAngleRef.current === forAngleId) {
          setProgress(null);
          setError(err instanceof Error ? err.message : "Failed to start script");
        }
      }
    },
    [caseId, runLoop]
  );

  function closePreview() {
    setPreview(null);
  }

  function openPreview(p: ScriptJobPreview) {
    setPreview(p);
  }

  function clearError() {
    setError(null);
  }

  return { writing: progress !== null, progress, error, preview, start, closePreview, openPreview, clearError };
}