// src/components/case-intelligence/CaseTimeline.tsx
"use client";

export function CaseTimeline({ caseId }: { caseId?: string }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Case Timeline</h3>
      </div>
      <p className="mt-4 text-xs text-slate-500">No timeline events extracted for this case yet.</p>
    </div>
  );
}