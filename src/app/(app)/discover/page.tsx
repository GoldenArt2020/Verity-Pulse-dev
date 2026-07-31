"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { OpportunityCard } from "@/components/find-opportunity/OpportunityCard";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";
import { CreatorDNACard } from "@/components/discover/CreatorDNACard";
import { RecommendedForYou } from "@/components/discover/RecommendedForYou";
import { SkeletonCard } from "@/components/discover/SkeletonCard";
import { useChannelId } from "@/hooks/useChannelId";
import { useCases } from "@/hooks/useCases";

const COLLECTIONS = [
  "Missing Persons",
  "Institutional Failures",
  "Cold Cases",
  "Organized Crime",
  "Police Corruption",
  "County Lines",
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const { channelId, channelHandle } = useChannelId();
  const { cases, loading, error } = useCases();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
          <p className="mt-2 text-lg text-[#A1A1AA]">Find your next documentary opportunity.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#71717A]">Current Channel</p>
          <p className="text-sm font-semibold text-[#FAFAFA]">@{channelHandle}</p>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative mt-10"
      >
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717A]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases, victims, suspects, locations..."
          className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#18181B] pl-14 pr-5 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none"
        />
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mt-14"
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
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>

        <div className="mt-5 space-y-4">
          {loading &&
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {error && (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
              We couldn&apos;t load opportunities right now.{" "}
              <button className="text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          )}

          {!loading && !error && cases.length === 0 && (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
              <p className="text-sm text-[#A1A1AA]">No opportunities yet.</p>
            </div>
          )}

          {!loading &&
            !error &&
            cases.map((c, i) => (
              <motion.div
                key={c.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
              >
                <OpportunityCard
                  id={c.id}
                  score={c.opportunityScore ?? 0}
                  title={c.name}
                  location={c.country ?? ""}
                  category={c.category ?? ""}
                  description={c.summary ?? ""}
                  competitionScore={c.competitionScore ?? 0}
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
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Collections</h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {COLLECTIONS.map((c, i) => (
            <motion.button
              key={c}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
            >
              <p className="font-semibold text-[#FAFAFA]">{c}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}