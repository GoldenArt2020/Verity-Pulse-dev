"use client";

const STEPS = [
  "Generate Angles",
  "Analyze & Refine",
  "Select Best Angle",
  "Build Narrative",
  "Optimize",
] as const;

export function StepTabs({
  active,
  onChange,
}: {
  active: number;
  onChange?: (index: number) => void;
}) {
  return (
    <div className="flex w-fit gap-5 border-b border-slate-800/60">
      {STEPS.map((s, i) => {
        const isActive = i === active;
        return (
          <button
            key={s}
            onClick={() => onChange?.(i)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
              isActive ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                isActive ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {i + 1}
            </span>
            {s}
          </button>
        );
      })}
    </div>
  );
}