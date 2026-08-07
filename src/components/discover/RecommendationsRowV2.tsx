"use client";

import { useState, useMemo } from "react";
import { RefreshCw, Bookmark, ArrowRight, Tv, Sparkles, TrendingUp, Zap, Globe2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useCaseNavigation } from "@/hooks/useCaseNavigation";
import { useChannelId } from "@/hooks/useChannelId";
import { AudienceSignalPanel } from "./AudienceSignalPanel";
import { RecommendationHistorySection } from "./RecommendationHistorySection";

const SECTION_META: Record<string, { label: string; description: string; icon: typeof Sparkles }> = {
  "for-you": {
    label: "For You",
    description: "Matched to your channel's proven audience and storytelling style.",
    icon: Sparkles,
  },
  "currently-trending": {
    label: "Currently Trending",
    description: "Cases with high search volume and public interest right now.",
    icon: TrendingUp,
  },
  "about-to-trend": {
    label: "About to Trend",
    description: "Early signals of rising interest before the wider audience catches on.",
    icon: Zap,
  },
};

const BREAKDOWN_LABELS: { key: string; label: string }[] = [
  { key: "creatorDnaMatch", label: "Creator DNA Match" },
  { key: "audienceInterest", label: "Audience Interest" },
  { key: "searchOpportunity", label: "Search Opportunity" },
  { key: "competition", label: "Competition" },
  { key: "untappedAngles", label: "Untapped Angles" },
  { key: "regionalMatch", label: "Regional Match" },
  { key: "newsMomentum", label: "News Momentum" },
  { key: "historicalPerformance", label: "Historical Performance" },
];

function RecommendationCard({
  r,
  isExpanded,
  onToggleExpand,
  onOpen,
  isNavigating,
  navigatingTo,
}: {
  r: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  isNavigating: boolean;
  navigatingTo: string | null;
}) {
  const matchScore = r.audienceMatch ?? 0;
  const displayRegion: string | null = r.displayRegion ?? null;
  const isRegionException: boolean = r.isRegionException ?? false;
  const breakdown = r.breakdown as Record<string, number> | undefined;
  const whyRecommended: string[] = r.whyRecommended ?? (r.reason ? [r.reason] : []);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex h-[420px] w-full flex-col justify-between rounded-[22px] border border-white/[0.08] bg-[#111114] p-6 shadow-xl transition-all hover:border-blue-500/40"
    >
      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          {displayRegion ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                isRegionException
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "text-[#71717A]"
              }`}
            >
              <Globe2 className="h-3 w-3" />
              {displayRegion}
              {isRegionException && <span className="font-medium">· Outside usual region</span>}
            </div>
          ) : (
            <span />
          )}
          <button className="text-[#71717A] hover:text-[#FAFAFA]" aria-label="Save">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="line-clamp-2 text-base font-bold text-[#FAFAFA] group-hover:text-blue-400 transition-colors">
            {r.title}
          </h3>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5 border-t border-white/[0.06] pt-3">
          <span className="text-xl font-black text-emerald-400">{matchScore}</span>
          <span className="text-xs font-medium text-[#71717A]">Opportunity Score</span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto max-h-40 border-t border-white/[0.06] mt-3 pt-2 text-xs leading-relaxed text-[#A1A1AA]"
            >
              {breakdown ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {BREAKDOWN_LABELS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[#71717A]">{label}</span>
                      <span className="font-medium text-[#D4D4D8]">{breakdown[key] ?? "—"}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {whyRecommended.map((w, i) => (
                    <li key={i}>· {w}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-3 border-t border-white/[0.04] mt-auto">
        <button
          onClick={onToggleExpand}
          className="mb-3 block w-full text-left text-xs font-semibold text-[#71717A] hover:text-[#FAFAFA] transition-colors"
        >
          {isExpanded ? "Hide breakdown" : "Why we recommend this →"}
        </button>

        <button
          onClick={onOpen}
          disabled={isNavigating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
        >
          {navigatingTo === r.title ? "Opening Brief…" : "View Brief"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function RecommendationSection({
  status,
  items,
  expanded,
  setExpanded,
  goToAngleBuilder,
  navigatingTo,
}: {
  status: string;
  items: any[];
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  goToAngleBuilder: (title: string) => void;
  navigatingTo: string | null;
}) {
  if (items.length === 0) return null;
  const meta = SECTION_META[status];
  const Icon = meta.icon;

  return (
    <div className="mt-8 first:mt-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">{meta.label}</h3>
          <p className="text-xs text-[#71717A]">{meta.description}</p>
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {items.map((r) => {
          const isExpanded = expanded === r.title;
          return (
            <RecommendationCard
              key={r.title}
              r={r}
              isExpanded={isExpanded}
              onToggleExpand={() => setExpanded(isExpanded ? null : r.title)}
              onOpen={() => goToAngleBuilder(r.title)}
              isNavigating={!!navigatingTo}
              navigatingTo={navigatingTo}
            />
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationsRowV2() {
  const { recommendations, loading, refreshing, error, refresh } = useRecommendations();
  const { goToAngleBuilder, navigatingTo } = useCaseNavigation();
  const { clearChannel } = useChannelId();
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byStatus = (status: string) =>
      recommendations
        .filter((r: any) => r.trendStatus === status)
        .sort((a: any, b: any) => (b.audienceMatch ?? 0) - (a.audienceMatch ?? 0))
        .slice(0, 4);

    const forYou = byStatus("for-you");
    const trending = byStatus("currently-trending");
    const aboutToTrend = byStatus("about-to-trend");

    // Fallback for old-format data with no trendStatus at all
    const untagged = recommendations.filter((r: any) => !r.trendStatus);
    const legacy = untagged.length > 0
      ? [...untagged].sort((a: any, b: any) => (b.audienceMatch ?? 0) - (a.audienceMatch ?? 0)).slice(0, 4)
      : [];

    return { forYou, trending, aboutToTrend, legacy };
  }, [recommendations]);

  const totalShown =
    grouped.forYou.length + grouped.trending.length + grouped.aboutToTrend.length + grouped.legacy.length;

  return (
    <section className="w-full min-w-0">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
            Curated Intelligence
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#FAFAFA]">
            Our Recommendations
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
            Today's strongest opportunities for your channel, grouped by how they were identified — personalized to your channel, trending right now, or on the rise. Refreshed automatically every night.
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

      <div className="mt-6 w-full min-w-0">
        <AudienceSignalPanel />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[420px] w-full animate-pulse rounded-[22px] border border-white/[0.06] bg-[#111114]" />
          ))}
        </div>
      )}

      {!loading && totalShown === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.12] bg-[#111114]/50 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-[#18181C]">
            <Tv className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#FAFAFA]">No recommendations yet</h3>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-[#71717A]">
            Connect your YouTube channel and allow VerityPulse to analyze your audience. The more we learn about your content, the better our recommendations become.
          </p>
          <button
            onClick={() => {
              clearChannel();
              window.location.reload();
            }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20"
          >
            Connect Channel
          </button>
        </div>
      )}

      {!loading && grouped.legacy.length > 0 && (
        <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {grouped.legacy.map((r: any) => {
            const isExpanded = expanded === r.title;
            return (
              <RecommendationCard
                key={r.title}
                r={r}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpanded(isExpanded ? null : r.title)}
                onOpen={() => goToAngleBuilder(r.title)}
                isNavigating={!!navigatingTo}
                navigatingTo={navigatingTo}
              />
            );
          })}
        </div>
      )}

      {!loading && (
        <>
          <RecommendationSection
            status="for-you"
            items={grouped.forYou}
            expanded={expanded}
            setExpanded={setExpanded}
            goToAngleBuilder={goToAngleBuilder}
            navigatingTo={navigatingTo}
          />
          <RecommendationSection
            status="currently-trending"
            items={grouped.trending}
            expanded={expanded}
            setExpanded={setExpanded}
            goToAngleBuilder={goToAngleBuilder}
            navigatingTo={navigatingTo}
          />
          <RecommendationSection
            status="about-to-trend"
            items={grouped.aboutToTrend}
            expanded={expanded}
            setExpanded={setExpanded}
            goToAngleBuilder={goToAngleBuilder}
            navigatingTo={navigatingTo}
          />
        </>
      )}

      <RecommendationHistorySection />
    </section>
  );
}