// src/components/case-intelligence/TopIntelligenceSources.tsx
"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SourceRow {
  publisher: string;
  url: string;
  date: string | null;
  reliability: string;
  type: string;
}

const RELIABILITY_VALUE: Record<string, number> = { HIGH: 90, MEDIUM: 70, LOW: 45 };

export function TopIntelligenceSources({ caseId }: { caseId: string }) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("sources")
      .select("publisher, url, date, reliability, type")
      .eq("case_id", caseId)
      .limit(5)
      .then(({ data }) => {
        if (!active) return;
        setSources(data ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Intelligence Sources</h3>
      </div>

      {loading && <div className="mt-3 h-24 animate-pulse rounded-xl bg-slate-800/30" />}

      {!loading && sources.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">No sources indexed yet.</p>
      )}

      {!loading && sources.length > 0 && (
        <div className="mt-3 space-y-1">
          {sources.map((s) => {
            const reliability = RELIABILITY_VALUE[s.reliability] ?? 60;
            const filled = Math.round((reliability / 100) * 7);
            return (
              <div key={s.url} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <Globe className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{s.publisher}</p>
                  <p className="text-[11px] text-slate-500">{s.type} {s.date ? `· ${s.date}` : ""}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-slate-500">Reliability</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-1.5 rounded-sm ${i < filled ? "bg-emerald-400" : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300">{reliability}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}