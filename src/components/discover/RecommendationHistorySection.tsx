// src/components/discover/RecommendationHistorySection.tsx
"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { useRecommendationHistory } from "@/hooks/useRecommendationHistory";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";

export function RecommendationHistorySection() {
  const [open, setOpen] = useState(false);
  const { history, loading, loaded, error, loadHistory } = useRecommendationHistory();
  const { goToAngleBuilder, navigatingTo } = useCaseNavigation();

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) loadHistory();
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-xs font-semibold text-[#71717A] hover:text-[#FAFAFA]"
      >
        <History className="h-3.5 w-3.5" />
        See More (past 15 days)
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          {loading && <div className="h-24 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]" />}

          {!loading && error && <p className="text-xs text-rose-400">{error}</p>}

          {!loading && !error && history.length === 0 && (
            <p className="text-xs text-[#71717A]">No archived recommendations yet — check back after the next daily refresh.</p>
          )}

          {!loading &&
            history.map((entry) => (
              <div key={entry.id}>
                <p className="text-[11px] font-medium text-[#71717A]">
                  {new Date(entry.generated_at).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {entry.recommendations.map((r) => (
                    <button
                      key={r.title}
                      onClick={() => goToAngleBuilder(r.title)}
                      disabled={!!navigatingTo}
                      className="rounded-xl border border-white/[0.06] bg-[#111114] p-3 text-left transition-colors hover:border-blue-500/30 disabled:opacity-50"
                    >
                      <p className="text-[13px] font-medium text-[#FAFAFA]">
                        {navigatingTo === r.title ? "Opening…" : r.title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#71717A]">{r.audienceMatch}% match</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}