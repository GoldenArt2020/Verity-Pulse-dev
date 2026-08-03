"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
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

// Deterministic hash based on today's UTC date string (YYYY-MM-DD)
function getDailySeed(): number {
  const todayStr = new Date().toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash << 5) - hash + todayStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function DiscoverPage() {
  const router = useRouter();
  const { channelId } = useChannelId();
  const { cases, loading, error } = useCases();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  // Filter researched cases
  const researchedCases = cases.filter(
    (c) => (c.opportunity_score ?? 0) > 0 && c.summary && c.summary.trim().length > 0
  );

  // Daily dynamic rotation at 12 AM UTC
  const dailyCases = useMemo(() => {
    if (researchedCases.length === 0) return [];
    const seed = getDailySeed();
    const rotated = [...researchedCases].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) || 0) + seed;
      const hashB = (b.id.charCodeAt(0) || 0) + seed;
      return (hashA % 100) - (hashB % 100);
    });
    return rotated;
  }, [researchedCases]);

  // Display top 4 cases for today
  const todaysFeatured = dailyCases.slice(0, 4);

  return (
    <div className="relative w-full max-w-full overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <IntelligenceGridBackground />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-12">
        {/* Main Column */}
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8 lg:gap-12">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }} className="w-full min-w-0">
            <DiscoverHero />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full min-w-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
                <p className="truncate text-xs text-[#71717A]">4 fresh picks for today · Rotates daily at 12:00 AM</p>
              </div>
              {researchedCases.length > 0 && (
                <button
                  onClick={() => router.push("/discover/opportunities")}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  View all ({researchedCases.length}) <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Scroll Container */}
            <div className="mt-5 flex w-full min-w-0 gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading && [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}

              {error && (
                <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
                  We couldn&apos;t load opportunities right now.{" "}
                  <button className="text-blue-400 hover:text-blue-300">Retry</button>
                </div>
              )}

              {!loading && !error && todaysFeatured.length === 0 && (
                <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
                  <p className="text-sm text-[#A1A1AA]">
                    No opportunities yet. Search for a case above to get started.
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                todaysFeatured.map((c, i) => (
                  <OpportunityCardV2
                    key={c.id}
                    id={c.id}
                    rank={i + 1}
                    title={c.name}
                    location={c.country ?? ""}
                    category={c.category ?? ""}
                    score={c.opportunity_score ?? 0}
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
            className="w-full min-w-0"
          >
            <RecommendationsRowV2 />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.35 }}
            className="w-full min-w-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Browse Collections</h2>
                <p className="truncate text-xs text-[#71717A]">Explore by theme and category</p>
              </div>
              <button
                onClick={() => router.push("/discover/collections")}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-5 w-full min-w-0">
              <CollectionsGrid />
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.3, delay: 0.1 }}
          className="hidden flex-col gap-6 lg:col-span-4 lg:flex lg:sticky lg:top-8 lg:self-start"
        >
          <ChannelStatusPanel />
          <AIInsightCard />
          <AudienceBreakdown />
        </motion.div>

      </div>
    </div>
  );
}