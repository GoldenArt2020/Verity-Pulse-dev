"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { OpportunityCard } from "@/components/find-opportunity/OpportunityCard";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";
import { ChannelStatusCard } from "@/components/discover/ChannelStatusCard";
import { CreatorDNACard } from "@/components/discover/CreatorDNACard";
import { RecommendedForYou } from "@/components/discover/RecommendedForYou";
import { CollectionsGrid } from "@/components/discover/CollectionsGrid";
import { SkeletonCard } from "@/components/discover/SkeletonCard";
import { useChannelId } from "@/hooks/useChannelId";
import { useCases } from "@/hooks/useCases";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const { channelId, channelHandle } = useChannelId();
  const { cases, loading, error } = useCases();
  const { goToCase, navigatingTo, error: navError } = useCaseNavigation();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  // Only show cases that have actually completed research — filters out
  // stub rows (score 0, empty summary) created by search but not yet analyzed.
  const researchedCases = cases.filter(
    (c) => (c.opportunity_score ?? 0) > 0 && c.summary && c.summary.trim().length > 0
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    goToCase(query.trim());
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3 }}
        className="grid grid-cols-[1fr_320px] gap-8"
      >
        <div>
          <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
          <p className="mt-2 text-lg text-[#A1A1AA]">
            {researchedCases.length > 0
              ? `${researchedCases.length} opportunities ready for you.`
              : "Find your next documentary opportunity."}
          </p>

          <form onSubmit={handleSearchSubmit} className="relative mt-8">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717A]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases, victims, suspects, locations..."
              disabled={!!navigatingTo}
              className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#18181B] pl-14 pr-32 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!query.trim() || !!navigatingTo}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
            >
              {navigatingTo ? "Opening..." : "Search"}
            </button>
          </form>

          {navError && <p className="mt-2 text-sm text-rose-400">{navError}</p>}
        </div>

        <ChannelStatusCard channelHandle={channelHandle ?? ""} />
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mt-10"
      >
        <CreatorDNACard />
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-14"
      >
        <RecommendedForYou />
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.25 }}
        className="mt-14"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
          {researchedCases.length > 0 && (
            <span className="text-xs text-[#71717A]">Ranked by opportunity score</span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          {loading && [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}

          {error && (
            <div className="col-span-2 rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
              We couldn&apos;t load opportunities right now.{" "}
              <button className="text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          )}

          {!loading && !error && researchedCases.length === 0 && (
            <div className="col-span-2 rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
              <p className="text-sm text-[#A1A1AA]">
                No opportunities yet. Search for a case above to get started.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            researchedCases.map((c, i) => (
              <motion.div
                key={c.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
              >
                <OpportunityCard
                  id={c.id}
                  rank={i + 1}
                  score={c.opportunity_score ?? 0}
                  title={c.name}
                  location={c.country ?? ""}
                  category={c.category ?? ""}
                  description={c.summary ?? ""}
                  competitionScore={c.competition_score ?? 0}
                />
              </motion.div>
            ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.35 }}
        className="mt-14"
      >
        <CollectionsGrid />
      </motion.div>
    </div>
  );
}