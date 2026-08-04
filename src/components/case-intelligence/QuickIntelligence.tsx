"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Counts {
  articlesAnalyzed: number;
  videosAnalyzed: number;
}

export function QuickIntelligence({ caseId, researched }: { caseId: string; researched: boolean }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!researched) {
      setCounts(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function load() {
      const supabase = createClient();

      const [{ count: sourcesCount }, { data: caseRow }] = await Promise.all([
        supabase.from("sources").select("*", { count: "exact", head: true }).eq("case_id", caseId),
        supabase.from("cases").select("youtube_titles").eq("id", caseId).single(),
      ]);

      if (!active) return;
      const youtubeTitles = (caseRow?.youtube_titles as string[] | null) ?? [];
      setCounts({
        articlesAnalyzed: sourcesCount ?? 0,
        videosAnalyzed: youtubeTitles.length,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [caseId, researched]);

  const stats = [
    { label: "Articles Analyzed", value: counts?.articlesAnalyzed ?? 0 },
    { label: "Videos Analyzed", value: counts?.videosAnalyzed ?? 0 },
    { label: "Reddit Threads", value: 0 },
    { label: "Court Documents", value: 0 },
    { label: "Police Reports", value: 0 },
    { label: "Forum Mentions", value: 0 },
  ];

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Quick Intelligence</h3>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className="font-mono-vp text-xl font-semibold text-white">
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>
      {!loading && counts && counts.articlesAnalyzed === 0 && counts.videosAnalyzed === 0 && (
        <p className="mt-3 text-[11px] text-slate-600">
          No sources or videos indexed for this case yet.
        </p>
      )}
    </div>
  );
}