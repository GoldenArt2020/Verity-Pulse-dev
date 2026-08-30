"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IntelligenceGridBackground } from "@/components/background/IntelligenceGridBackground";
import { DiscoverHero } from "@/components/discover/DiscoverHero";
import { ChannelStatusPanel } from "@/components/discover/ChannelStatusPanel";
import { AIInsightCard } from "@/components/discover/AIInsightCard";
import { AudienceBreakdown } from "@/components/discover/AudienceBreakdown";
import { RecommendationsRowV2 } from "@/components/discover/RecommendationsRowV2";
import { CollectionsGrid } from "@/components/discover/CollectionsGrid";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";
import { useChannelId } from "@/hooks/useChannelId";
import { TrendingUpdatesSection } from "@/components/discover/TrendingUpdatesSection";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DiscoverPage() {
  const router = useRouter();
  const { channelId } = useChannelId();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <IntelligenceGridBackground />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8 lg:gap-12">
          {/* Hero Header */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }} className="w-full min-w-0">
            <DiscoverHero />
          </motion.div>

          {/* Trending updates â€” significant developments in already-known cases */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full min-w-0"
          >
            <TrendingUpdatesSection />
          </motion.div>

          {/* 1. Recommended For Your Audience */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full min-w-0"
          >
            <RecommendationsRowV2 />
          </motion.div>

          {/* 2. Browse Collections */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.25 }}
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

        {/* Sidebar */}
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
