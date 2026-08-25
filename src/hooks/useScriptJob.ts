"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * Drives start -> section(...) -> finish for the new entitlements-backed
 * script pipeline (/api/scripts/*), one HTTP request at a time so no
 * single request risks a serverless timeout regardless of script length.
 * Note: the new writer (claudeScriptWriter.ts) does not produce an SEO
 * summary — that field is gone from this hook entirely, unlike the old
 * Groq-based flow.
 */
export function useScriptJob({ angleId, caseId, hasExistingScript, onComplete }: UseScriptJobOptions) {
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<ScriptJobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScriptJobPreview | null>(null);

  const selectedAngleRef = useRef<string | null>(angleId);
  const runningAngleRef = useRef<string | null>(null);

  useEffect(() => {
    selectedAngleRef.current = angleId;
  }, [angleId]);

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
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to write section");
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
        const finishData = await finishRes.json();
        if (!finishRes.ok) throw new Error(finishData.error ?? "Failed to finish script");

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

  useEffect(() => {
    if (!angleId || hasExistingScript) return;
    if (runningAngleRef.current === angleId) return;

    let cancelled = false;
    setChecking(true);
    fetch(`/api/scripts/active?angleId=${angleId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to check for an active script");
        if (cancelled || selectedAngleRef.current !== angleId) return;
        if (data.job) {
          runningAngleRef.current = angleId;
          setProgress({ sectionsCompleted: data.job.sectionsCompleted, totalSections: data.job.totalSections });
          runLoop(data.job.jobId, angleId);
        }
      })
      .catch(() => {
        // Silent — worst case the person just sees "Write Script" fresh.
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angleId, hasExistingScript, runLoop]);

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to start script");
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

  return { checking, writing: progress !== null, progress, error, preview, start, closePreview, openPreview, clearError };
}