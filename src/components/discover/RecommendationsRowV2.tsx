"use client";

import { RefreshCw, Bookmark, ArrowRight } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";

export function RecommendationsRowV2() {
  const { recommendations, loading, refreshing, error, refresh } = useRecommendations();
  const { goToCase, navigatingTo } = useCaseNavigation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[#FAFAFA]">Recommended For Your Audience</p>
          <p className="text-xs text-[#71717A]">Handpicked based on your channel DNA and viewer behaviour</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View all recommendations <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={refresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-blue-400 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 w-[320px] shrink-0 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]"
            />
          ))}

        {!loading && recommendations.length === 0 && (
          <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center">
            <p className="text-sm text-[#A1A1AA]">
              No recommendations yet.{" "}
              <button onClick={refresh} className="text-blue-400 hover:text-blue-300">
                Generate now
              </button>
            </p>
          </div>
        )}

        {!loading &&
          recommendations.map((r) => (
            <button
              key={r.title}
              onClick={() => goToCase(r.title)}
              disabled={!!navigatingTo}
              className="group relative w-[320px] shrink-0 rounded-[18px] border border-white/[0.06] bg-[#111114] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 disabled:opacity-60"
            >
              <Bookmark className="absolute right-4 top-4 h-4 w-4 text-[#71717A]" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 text-xs font-bold text-emerald-400">
                {r.audienceMatch}
              </div>
              <p className="mt-3 pr-6 text-sm font-semibold leading-snug text-[#FAFAFA]">
                {navigatingTo === r.title ? "Opening…" : r.title}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs text-[#A1A1AA]">{r.reason}</p>
            </button>
          ))}
      </div>
    </div>
  );
}