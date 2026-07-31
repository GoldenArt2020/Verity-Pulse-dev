import { Search, FileQuestion, Scale, AlertTriangle, MapPin } from "lucide-react";

export type CaseCategory =
  | "missing-person"
  | "unsolved-murder"
  | "court-case"
  | "cold-case"
  | "general";

const CATEGORY_CONFIG: Record<CaseCategory, { icon: typeof Search }> = {
  "missing-person": { icon: Search },
  "unsolved-murder": { icon: FileQuestion },
  "court-case": { icon: Scale },
  "cold-case": { icon: AlertTriangle },
  "general": { icon: MapPin },
};

export function CaseVisual({
  category = "general",
  className = "",
}: {
  category?: CaseCategory;
  className?: string;
}) {
  const { icon: Icon } = CATEGORY_CONFIG[category];

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black ${className}`}
    >
      <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:16px_16px]" />
      <Icon className="h-16 w-16 text-slate-600" strokeWidth={1.25} />
    </div>
  );
}