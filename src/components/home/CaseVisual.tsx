"use client";

import { SCENES } from "@/lib/illustrations/sceneLibrary";
import { selectScene } from "@/lib/illustrations/selectScene";
import { useCaseVisual } from "@/hooks/useCaseVisual";

export type CaseCategory =
  | "missing-person"
  | "unsolved-murder"
  | "court-case"
  | "cold-case"
  | "general";

export function CaseVisual({
  caseId,
  category = "general",
  description,
  allowVideo = false,
  className = "",
}: {
  caseId?: string;
  category?: CaseCategory;
  description?: string;
  allowVideo?: boolean;
  className?: string;
}) {
  const { url, type, posterUrl, loading } = useCaseVisual(caseId ?? "", category, allowVideo);
  const sceneKey = selectScene({ category, description });
  const Scene = SCENES[sceneKey];

  if (!caseId || (!loading && !url)) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Scene />
      </div>
    );
  }

  if (loading) {
    return <div className={`relative overflow-hidden bg-slate-800 animate-pulse ${className}`} />;
  }

  if (type === "video") {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <video
          src={url!}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url!} alt="" className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}