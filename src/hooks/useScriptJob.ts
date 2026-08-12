"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScriptWordCount } from "@/constants/scriptOptions";

export interface ScriptSeoSummary {
  keywords: string[];
  description: string;
}

export interface ScriptJobProgress {
  sectionsCompleted: number;
  totalSections: number;
}

export interface ScriptJobPreview {
  script: string;
  wordCount: number;
  seo: ScriptSeoSummary | null;
}

interface UseScriptJobOptions {
  /** The angle currently selected/shown. Pass null when nothing is selected. */
  angleId: string | null;
  caseId: string;
  /** Skip the auto-resume check for angles that already have a saved script. */
  hasExistingScript: boolean;
  onComplete: (angleId: string, script: string, wordCount: number, seo: ScriptSeoSummary | null) => void;
}

/**
 * Drives the full start -> section(...) -> finish job loop for whichever
 * angle is currently selected, one HTTP request at a time so nothing ever
 * risks a serverless timeout regardless of total script length.
 *
 * Auto-resume: the moment an angle without a finished script is selected,
 * this checks /api/generate-script/active for an unfinished job and, if
 * one exists, silently continues it from wherever it left off — no button,
 * no user action. If the person switches to a different angle mid-job, the
 * loop simply pauses (stops issuing further requests) rather than racing
 * in the background; the job itself is safe on the server and picks back
 * up automatically the next time that angle is selected.
 */
export function useScriptJob({ angleId, caseId, hasExistingScript, onComplete }: UseScriptJobOptions) {
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<ScriptJobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScriptJobPreview | null>(null);

  // Always mirrors the currently selected angle — used inside the async
  // loop to detect "the user navigated away, pause" without needing to
  // cancel an in-flight fetch.
  const selectedAngleRef = useRef<string | null>(angleId);
  // Which angle's job is actively running (guards against starting a
  // second resume-loop for a job that's already being driven).
  const runningAngleRef = useRef<string | null>(null);

  useEffect(() => {
    selectedAngleRef.current = angleId;
  }, [angleId]);

  const runLoop = useCallback(
    async (jobId: string, forAngleId: string) => {
      try {
        let done = false;
        while (!done) {
          if (selectedAngleRef.current !== forAngleId) return; // paused — user navigated away
          const res = await fetch("/api/generate-script/section", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to write section");
          done = data.done;
          if (selectedAngleRef.current === forAngleId) {
            setProgress({ sectionsCompleted: data.sectionsCompleted, totalSections: data.totalSections });
          }
        }

        if (selectedAngleRef.current !== forAngleId) return;
        const finishRes = await fetch("/api/generate-script/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const finishData = await finishRes.json();
        if (!finishRes.ok) throw new Error(finishData.error ?? "Failed to finish script");

        runningAngleRef.current = null;
        onComplete(forAngleId, finishData.script, finishData.wordCount, finishData.seo ?? null);
        if (selectedAngleRef.current === forAngleId) {
          setProgress(null);
          setPreview({ script: finishData.script, wordCount: finishData.wordCount, seo: finishData.seo ?? null });
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

  // Auto-resume: whenever the selected angle changes to one without a
  // finished script, check for and silently continue any unfinished job.
  useEffect(() => {
    if (!angleId || hasExistingScript) return;
    if (runningAngleRef.current === angleId) return; // already driving this one

    let cancelled = false;
    setChecking(true);
    fetch(`/api/generate-script/active?angleId=${angleId}`)
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
        // Silent — worst case the person just sees "Write Script" and can
        // start clean; not worth surfacing a resume-check failure.
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
        const res = await fetch("/api/generate-script/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ angleId: forAngleId, caseId, wordCount }),
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

  return {
    checking,
    writing: progress !== null,
    progress,
    error,
    preview,
    start,
    closePreview,
    openPreview,
    clearError,
  };
}