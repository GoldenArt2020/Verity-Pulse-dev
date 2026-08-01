"use client";

import { RECOMMENDED_FOR_YOU } from "@/constants/creatorDNA";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";

// NOTE: still mock RECOMMENDATION data (which cases to suggest, and why).
// What's now real: clicking a card creates/finds a real Case row via
// getOrCreateCase and navigates to a real /case-analyzer/[id]. The next gap
// is a recommendation engine that scores real Cases against ChannelDNA
// (src/services/creatorDNA.ts) — that doesn't exist yet.
export function RecommendedForYou() {
  const { goToCase, navigatingTo, error } = useCaseNavigation();

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#FAFAFA]">Recommended For You</h2>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      <div className="mt-5 space-y-3">
        {RECOMMENDED_FOR_YOU.map((r) => {
          const isNavigating = navigatingTo === r.title;
          return (
            <button
              key={r.title}
              onClick={() => goToCase(r.title)}
              disabled={!!navigatingTo}
              className="group block w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#FAFAFA]">{r.title}</p>
                <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-400">
                  {isNavigating ? "Opening..." : `${r.audienceMatch}% Match`}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#A1A1AA]">{r.reason}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}