// src/components/angle-builder/TitleIdeasList.tsx
"use client";

import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

export function TitleIdeasList({ angles }: { angles: GeneratedAngle[] }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Title Ideas</h3>

      {angles.length === 0 && <p className="mt-3 text-xs text-slate-500">No titles yet — generate angles first.</p>}

      {angles.length > 0 && (
        <div className="mt-3 space-y-1">
          {angles.map((a, i) => (
            <div key={a.title} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-slate-500">{i + 1}</span>
              <p className="min-w-0 flex-1 text-[12px] leading-snug text-slate-300">{a.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}