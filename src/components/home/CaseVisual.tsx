import { SCENES } from "@/lib/illustrations/sceneLibrary";
import { selectScene } from "@/lib/illustrations/selectScene";

export type CaseCategory =
  | "missing-person"
  | "unsolved-murder"
  | "court-case"
  | "cold-case"
  | "general";

export function CaseVisual({
  category = "general",
  description,
  className = "",
}: {
  category?: CaseCategory;
  /** Pass the case's real researched description/summary so the illustration matches its content */
  description?: string;
  className?: string;
}) {
  const sceneKey = selectScene({ category, description });
  const Scene = SCENES[sceneKey];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Scene />
    </div>
  );
}