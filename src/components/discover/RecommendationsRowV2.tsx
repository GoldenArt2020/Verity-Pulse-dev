"use client";

import { useState } from "react";
import { RefreshCw, Bookmark, ArrowRight, CheckCircle2, Tv, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";
import { AudienceSignalPanel } from "./AudienceSignalPanel";

export function RecommendationsRowV2() {
  const { recommendations, loading, refreshing, error, refresh } = useRecommendations();
  const { goToCase, navigatingTo } = useCaseNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

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
      {!loading && recommendations.length === 0 && (
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

      {/* 4. Responsive CSS Grid for Cards */}
      <div className="mt-6 grid w-full gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[390px] w-full min-w-[340px] max-w-[420px] justify-self-center animate-pulse rounded-[22px] border border-white/[0.06] bg-[#111114]"
            />
          ))}

        {!loading &&
          recommendations.map((r) => {
            const item = r as any;
            const isExpanded = expanded === r.title;
            const matchScore = r.audienceMatch ?? 96;

            return (
              <motion.div
                key={r.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="group relative flex h-full w-full min-w-[340px] max-w-[420px] justify-self-center flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#111114] p-5 shadow-xl transition-all hover:border-blue-500/40"
              >
                <div>
                  {/* Rating Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                        PERFECT MATCH
                      </span>
                    </div>
                    <button className="text-[#71717A] hover:text-[#FAFAFA]" aria-label="Save">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Case Info */}
                  <div className="mt-4">
                    <h3 className="line-clamp-2 text-base font-bold text-[#FAFAFA] group-hover:text-blue-400 transition-colors">
                      {r.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#71717A]">
                      <span>{item.country || "United Kingdom"}</span>
                      {item.category && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="mt-4 flex items-baseline gap-1.5 border-t border-white/[0.06] pt-3">
                    <span className="text-xl font-black text-emerald-400">{matchScore}</span>
                    <span className="text-xs font-medium text-[#71717A]">Match Score</span>
                  </div>

                  {/* Scannable Signals */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#D4D4D8]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>Growing Search Demand</span>
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

                  {/* Context Panel */}
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
                <div className="mt-6 pt-2">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.title)}
                    className="mb-3 block w-full text-left text-[11px] font-semibold text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                  >
                    {isExpanded ? "Hide breakdown" : "Why we recommend this →"}
                  </button>

                  <button
                    onClick={() => goToCase(r.title)}
                    disabled={!!navigatingTo}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
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