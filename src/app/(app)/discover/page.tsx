"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IntelligenceGridBackground } from "@/components/background/IntelligenceGridBackground";
import { DiscoverHero } from "@/components/discover/DiscoverHero";
import { ChannelStatusPanel } from "@/components/discover/ChannelStatusPanel";
import { AIInsightCard } from "@/components/discover/AIInsightCard";
import { AudienceBreakdown } from "@/components/discover/AudienceBreakdown";
import { RecommendationsRowV2 } from "@/components/discover/RecommendationsRowV2";
import { OpportunityCardV2 } from "@/components/discover/OpportunityCardV2";
import { CollectionsGrid } from "@/components/discover/CollectionsGrid";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";
import { SkeletonCard } from "@/components/discover/SkeletonCard";
import { useChannelId } from "@/hooks/useChannelId";
import { useCases } from "@/hooks/useCases";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DiscoverPage() {
  const { channelId } = useChannelId();
  const { cases, loading, error } = useCases();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  const researchedCases = cases.filter(
    (c) => (c.opportunity_score ?? 0) > 0 && c.summary && c.summary.trim().length > 0
  );

  return (
    <div className="relative w-full max-w-full overflow-x-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <IntelligenceGridBackground />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:justify-center lg:px-8 lg:py-12">
        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:max-w-3xl lg:gap-12">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }}>
            <DiscoverHero />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3, delay: 0.15 }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
                <p className="truncate text-xs text-[#71717A]">Ranked by opportunity score and audience fit</p>
              </div>
              {researchedCases.length > 0 && (
                <button className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
                  View all ({researchedCases.length}) <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="mt-5 flex w-full min-w-0 gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {error && (
                <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
                  We couldn&apos;t load opportunities right now.{" "}
                  <button className="text-blue-400 hover:text-blue-300">Retry</button>
                </div>
              )}

              {!loading && !error && researchedCases.length === 0 && (
                <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
                  <p className="text-sm text-[#A1A1AA]">
                    No opportunities yet. Search for a case above to get started.
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                researchedCases.map((c, i) => (
                  <OpportunityCardV2
                    key={c.id}
                    id={c.id}
                    rank={i + 1}
                    title={c.name}
                    location={c.country ?? ""}
                    category={c.category ?? ""}
                    description={c.summary ?? ""}
                    score={c.opportunity_score ?? 0}
                    competition={
                      (c.competition_score ?? 0) >= 66
                        ? "High"
                        : (c.competition_score ?? 0) >= 33
                        ? "Medium"
                        : "Low"
                    }
                    searchTrend="Steady"
                    audienceMatch={c.opportunity_score ?? 0}
                  />
                ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3, delay: 0.15 }} className="min-w-0">
            <RecommendationsRowV2 />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3, delay: 0.35 }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Browse Collections</h2>
                <p className="truncate text-xs text-[#71717A]">Explore by theme and category</p>
              </div>
              <button className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-5">
              <CollectionsGrid />
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, delay: 0.1 }}
          className="hidden min-w-0 flex-col gap-6 lg:sticky lg:top-8 lg:flex lg:w-[320px] lg:shrink-0 lg:self-start xl:w-[380px]"
        >
          <ChannelStatusPanel />
          <AIInsightCard />
          <AudienceBreakdown />
        </motion.div>
      </div>
    </div>
  );
}