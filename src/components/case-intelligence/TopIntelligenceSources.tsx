"use client";

import { Globe } from "lucide-react";
import { useCaseSources } from "@/hooks/useCaseSources";

// Reliability is stored as HIGH/MEDIUM/LOW (runCaseResearch currently always
// saves MEDIUM — there's no per-source reliability scoring yet, that would
// need its own logic later). Mapped to a rough numeric value just for the
// bar display, not a real computed score.
const RELIABILITY_VALUE: Record<string, number> = {
  HIGH: 90,
  MEDIUM: 65,
  LOW: 35,
};

function reliabilityColor(v: number) {
  return v >= 85 ? "bg-emerald-400" : v >= 70 ? "bg-emerald-400/70" : "bg-amber-400";
}

export function TopIntelligenceSources({ caseId }: { caseId: string }) {
  const { sources, loading, error } = useCaseSources(caseId);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Intelligence Sources</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {loading && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-slate-800/40" />
            ))}
          </div>
        )}

        {error && <p className="py-4 text-sm text-rose-400">{error}</p>}

        {!loading && !error && sources.length === 0 && (
          <p className="py-4 text-sm text-slate-500">No sources found yet.</p>
        )}

        {!loading &&
          !error &&
          sources.map((s) => {
            const reliabilityValue = RELIABILITY_VALUE[s.reliability ?? "MEDIUM"];
            const filled = Math.round((reliabilityValue / 100) * 7);
            return (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <Globe className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{s.publisher}</p>
                  <p className="truncate text-[11px] text-slate-500">{s.type ?? "web"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-slate-500">Reliability</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-1.5 rounded-sm ${
                            i < filled ? reliabilityColor(reliabilityValue) : "bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300">{s.reliability ?? "—"}</span>
                  </div>
                </div>
              </a>
            );
          })}
      </div>
    </div>
  );
}