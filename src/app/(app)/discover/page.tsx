"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function DiscoverPage() {
  const router = useRouter();
  const { channelId } = useChannelId();
  const { cases, loading, error } = useCases();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real database cases directly
  const realCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    return cases;
  }, [cases]);

  // Deterministic daily midnight rotation
  const todaysFeatured = useMemo(() => {
    if (!mounted || realCases.length === 0) return realCases.slice(0, 4);

    const todayStr = new Date().toISOString().split("T")[0];
    let seed = 0;
    for (let i = 0; i < todayStr.length; i++) {
      seed = (seed << 5) - seed + todayStr.charCodeAt(i);
      seed |= 0;
    }
    seed = Math.abs(seed);

    const sorted = [...realCases].sort((a, b) => {
      const idA = String(a.id ?? "");
      const idB = String(b.id ?? "");
      const valA = (idA.charCodeAt(0) || 0) + seed;
      const valB = (idB.charCodeAt(0) || 0) + seed;
      return (valA % 100) - (valB % 100);
    });

    return sorted.slice(0, 4);
  }, [realCases, mounted]);

  const remainingCount = Math.max(0, realCases.length - todaysFeatured.length);

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

          {/* 1. Recommended For Your Audience (Now First) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full min-w-0"
          >
            <RecommendationsRowV2 />
          </motion.div>

          {/* 2. Today's Opportunities (Now Second with Tighter 3-Column Width) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.25 }}
            className="w-full min-w-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
                <p className="truncate text-xs text-[#71717A]">4 daily selections · Rotates at 12:00 AM UTC</p>
              </div>
              
              {remainingCount > 0 && (
                <button
                  onClick={() => router.push("/discover/opportunities")}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  View all ({remainingCount}) <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Changed from sm:grid-cols-2 to sm:grid-cols-2 md:grid-cols-3 for smaller card widths */}
            <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(loading || !mounted) && [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}

              {!loading && mounted && error && (
                <div className="col-span-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
                  We couldn&apos;t load opportunities right now.
                </div>
              )}

              {!loading && mounted && !error && todaysFeatured.length === 0 && (
                <div className="col-span-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
                  <p className="text-sm text-[#A1A1AA]">
                    No opportunities yet. Search for a case above to get started.
                  </p>
                </div>
              )}

              {!loading &&
                mounted &&
                !error &&
                todaysFeatured.map((c, i) => (
                  <OpportunityCardV2
                    key={c.id ?? i}
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

          {/* 3. Browse Collections */}
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