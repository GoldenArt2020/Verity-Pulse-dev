"use client";

import { useState, useMemo } from "react";
import { RefreshCw, Bookmark, ArrowRight, CheckCircle2, Tv, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";
import { AudienceSignalPanel } from "./AudienceSignalPanel";

export function RecommendationsRowV2() {
  const { recommendations, loading, refreshing, error, refresh } = useRecommendations();
  const { goToCase, navigatingTo } = useCaseNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Sort by highest match score and slice to EXACTLY 4 cards
  const topRecommendations = useMemo(() => {
    return [...recommendations]
      .sort((a: any, b: any) => (b.audienceMatch ?? 0) - (a.audienceMatch ?? 0))
      .slice(0, 4);
  }, [recommendations]);

  return (
    <section className="w-full min-w-0">
      {/* 1. Header & Concept Intro */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
            Curated Intelligence
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#FAFAFA]">
            Our Recommendations
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
            Today’s strongest opportunities for your channel. Every recommendation is ranked using your Creator DNA, current search behaviour, competition analysis, and narrative opportunities.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing || loading}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111114] px-4 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-white/[0.15] hover:text-[#FAFAFA] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          {refreshing ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      {/* 2. Signals Panel Context */}
      <div className="mt-6 w-full min-w-0">
        <AudienceSignalPanel />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && topRecommendations.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.12] bg-[#111114]/50 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-[#18181C]">
            <Tv className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#FAFAFA]">No recommendations yet</h3>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-[#71717A]">
            Connect your YouTube channel and allow VerityPulse to analyze your audience. The more we learn about your content, the better our recommendations become.
          </p>
          <button
            onClick={refresh}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20"
          >
            Connect Channel
          </button>
        </div>
      )}

      {/* 4. Vertically Stacked Cards Container (1 Column) */}
      <div className="mt-6 grid w-full grid-cols-1 gap-6">
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[280px] w-full animate-pulse rounded-[22px] border border-white/[0.06] bg-[#111114]"
            />
          ))}

        {!loading &&
          topRecommendations.map((r) => {
            const item = r as any;
            const isExpanded = expanded === r.title;
            const matchScore = r.audienceMatch ?? 96;

            return (
              <motion.div
                key={r.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="group relative flex w-full flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#111114] p-6 shadow-xl transition-all hover:border-blue-500/40"
              >
                <div>
                  {/* Rating Header & Actions */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                    <div className="flex items-center gap-1.5">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                        PERFECT MATCH
                      </span>
                    </div>
                    <button className="text-[#71717A] hover:text-[#FAFAFA]" aria-label="Save">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Title & Location / Category */}
                  <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-bold text-[#FAFAFA] group-hover:text-blue-400 transition-colors">
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                      <span>{item.country || "United Kingdom"}</span>
                      {item.category && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match Score & Signals */}
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.06] pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">{matchScore}</span>
                      <span className="text-xs font-medium text-[#71717A]">Match Score</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:items-center sm:gap-6">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#D4D4D8]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>Growing Demand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#D4D4D8]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>Low Competition</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#D4D4D8]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>5 Untouched Angles</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#D4D4D8]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>High Audience Fit</span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Explanation Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/[0.06] mt-4 pt-3 text-xs leading-relaxed text-[#A1A1AA]"
                      >
                        {r.reason || "This case matches your channel's narrative profile. Viewer interest is rising while production saturation remains low."}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.04] pt-4">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.title)}
                    className="text-left text-xs font-semibold text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                  >
                    {isExpanded ? "Hide breakdown" : "Why we recommend this →"}
                  </button>

                  <button
                    onClick={() => goToCase(r.title)}
                    disabled={!!navigatingTo}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 px-5 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 sm:w-auto"
                  >
                    {navigatingTo === r.title ? "Opening Brief…" : "View Brief"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
      </div>
    </section>
  );
}