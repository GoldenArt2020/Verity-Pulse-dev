"use client";

import type { GeneratedAngle } from "@/app/angle-builder/[caseId]/page";

export function TitleIdeasList({ angles }: { angles: GeneratedAngle[] }) {
  const titleIdeas = angles.find((a) => (a.titleIdeas?.length ?? 0) > 0)?.titleIdeas ?? [];

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Title Ideas</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Grounded in real, currently high-momentum titles — ranked by views/day, not raw views.
      </p>

      {titleIdeas.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">No titles yet — generate angles first.</p>
      )}

      {titleIdeas.length > 0 && (
        <div className="mt-3 space-y-2">
          {titleIdeas.map((idea, i) => (
            <div key={`${idea.title}-${i}`} className="rounded-xl p-2 hover:bg-slate-800/40">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-slate-500">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-slate-300">{idea.title}</p>
                  {idea.formula && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                        {idea.formula}
                      </span>
                      {idea.inspiredBy && (
                        <span className="text-[10px] text-slate-600" title={idea.inspiredBy}>
                          modeled on &quot;{idea.inspiredBy.length > 42 ? `${idea.inspiredBy.slice(0, 42)}…` : idea.inspiredBy}&quot;
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}