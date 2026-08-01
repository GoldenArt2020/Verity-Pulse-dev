"use client";

import { RefreshCw } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";

export function RecommendedForYou() {
  const { recommendations, generatedAt, loading, refreshing, error, refresh } = useRecommendations();
  const { goToCase, navigatingTo, error: navError } = useCaseNavigation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Recommended For You</h2>
        <button
          onClick={refresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] transition-colors hover:text-blue-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {generatedAt && !refreshing && (
        <p className="mt-1 text-xs text-[#71717A]">
          Based on your top videos · Last updated {new Date(generatedAt).toLocaleDateString()}
        </p>
      )}

      {(error || navError) && (
        <p className="mt-2 text-sm text-rose-400">{error ?? navError}</p>
      )}

      <div className="mt-5 space-y-3">
        {loading &&
          [1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]" />
          ))}

        {!loading && recommendations.length === 0 && !refreshing && (
          <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center">
            <p className="text-sm text-[#A1A1AA]">
              No recommendations yet.{" "}
              <button onClick={refresh} className="text-blue-400 hover:text-blue-300">
                Generate now
              </button>
            </p>
          </div>
        )}

        {!loading &&
          recommendations.map((r) => {
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