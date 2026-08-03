"use client";

import { motion } from "framer-motion";
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
    <div className="mx-auto max-w-7xl px-8 py-12">
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }}>
        <DiscoverHero />
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="min-w-0">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3, delay: 0.15 }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
              {researchedCases.length > 0 && (
                <span className="text-xs text-[#71717A]">Ranked by opportunity score</span>
              )}
            </div>

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {loading && [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}

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

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-14"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#FAFAFA]">Browse Collections</h2>
            </div>
            <div className="mt-5">
              <CollectionsGrid />
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.35 }}
            className="mt-14"
          >
            <RecommendationsRowV2 />
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start"
        >
          <ChannelStatusPanel />
          <AIInsightCard />
          <AudienceBreakdown />
        </motion.div>
      </div>
    </div>
  );
}