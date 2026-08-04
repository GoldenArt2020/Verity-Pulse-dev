"use client";

import { useState } from "react";
import { RefreshCw, Bookmark, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";
import { AudienceSignalPanel } from "./AudienceSignalPanel";

const BADGE_LABEL: Record<string, string> = {
  "for-you": "Perfect Match",
  "currently-trending": "Currently Trending",
  "about-to-trend": "About to Trend",
};

const BADGE_COLOR: Record<string, string> = {
  "for-you": "text-emerald-400",
  "currently-trending": "text-rose-400",
  "about-to-trend": "text-amber-400",
};

export function RecommendationsRowV2() {
  const { recommendations, loading, refreshing, error, refresh } = useRecommendations();
  const { goToCase, navigatingTo } = useCaseNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[#FAFAFA]">Recommended For Your Audience</p>
          <p className="text-xs text-[#71717A]">Handpicked based on your channel DNA and viewer behaviour</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-blue-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-4">
        <AudienceSignalPanel />
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 w-[340px] shrink-0 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]"
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
          recommendations.map((r) => {
            const isExpanded = expanded === r.title;
            const badgeLabel = BADGE_LABEL[r.trendStatus] ?? "Perfect Match";
            const badgeColor = BADGE_COLOR[r.trendStatus] ?? "text-emerald-400";

            return (
              <motion.div
                key={r.title}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-[340px] shrink-0 rounded-[18px] border border-white/[0.06] bg-[#111114] p-5 transition-colors duration-200 hover:border-blue-500/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${badgeColor} ${
                        r.trendStatus === "for-you"
                          ? "border-emerald-500"
                          : r.trendStatus === "currently-trending"
                            ? "border-rose-500"
                            : "border-amber-500"
                      }`}
                    >
                      {r.audienceMatch}
                    </div>
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                  </div>
                  <button className="text-[#71717A] hover:text-blue-400" aria-label="Save">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => goToCase(r.title)}
                  disabled={!!navigatingTo}
                  className="mt-3 block w-full text-left disabled:opacity-60"
                >
                  <p className="text-base font-semibold leading-snug text-[#FAFAFA]">
                    {navigatingTo === r.title ? "Opening…" : r.title}
                  </p>
                </button>

                <button
                  onClick={() => setExpanded(isExpanded ? null : r.title)}
                  className="mt-3 flex w-full items-center justify-between border-t border-white/[0.06] pt-3 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Why AI picked this
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden text-xs leading-relaxed text-[#A1A1AA]"
                    >
                      <span className="mt-2 block">{r.reason}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}