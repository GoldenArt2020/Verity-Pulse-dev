"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SEOMetadata {
  title: string;
  description: string;
  tags: string[];
}

export type WordCountOption = 5000 | 10000 | 15000;

export interface ScriptGenerationAngle {
  id: string;
  title: string;
}

interface GeneratedResult {
  script: string;
  wordCount: number;
  seo: SEOMetadata | null;
}

/**
 * Encapsulates the "write script" flow shared by the Angle Builder and the
 * Projects area: pick a word count -> generate (research + write + SEO) ->
 * preview the full script -> optionally open the case's ongoing Project.
 */
export function useScriptGeneration(caseId: string) {
  const router = useRouter();
  const [pendingAngle, setPendingAngle] = useState<ScriptGenerationAngle | null>(null);
  const [writingAngleId, setWritingAngleId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [openingProject, setOpeningProject] = useState(false);

  function requestWordCount(angle: ScriptGenerationAngle) {
    setWriteError(null);
    setPendingAngle(angle);
  }

  function cancelWordCount() {
    setPendingAngle(null);
  }

  async function generate(wordCount: WordCountOption, onSaved?: (script: string) => void) {
    const angle = pendingAngle;
    if (!angle) return;
    setWritingAngleId(angle.id);
    setWriteError(null);
    setPendingAngle(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angleId: angle.id, caseId, wordCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to write script");
      setResult({ script: data.script, wordCount: data.wordCount ?? wordCount, seo: data.seo ?? null });
      onSaved?.(data.script);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to write script");
    } finally {
      setWritingAngleId(null);
    }
  }

  function closePreview() {
    setResult(null);
  }

  async function openInProject() {
    setOpeningProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, status: "NARRATIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open project");
      setResult(null);
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to open project");
    } finally {
      setOpeningProject(false);
    }
  }

  return {
    pendingAngle,
    writingAngleId,
    writeError,
    result,
    openingProject,
    requestWordCount,
    cancelWordCount,
    generate,
    closePreview,
    openInProject,
  };
}