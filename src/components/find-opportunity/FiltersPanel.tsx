"use client";

const FILTERS = ["Opportunity", "Competition", "Country", "Case Type", "Sort"];

export function FiltersPanel() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/50"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}