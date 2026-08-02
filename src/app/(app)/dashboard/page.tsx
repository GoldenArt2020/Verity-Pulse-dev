"use client";

import { useMemo } from "react";
import { useDailyBrief } from "@/hooks/useDailyBrief";
import { useChannelId } from "@/hooks/useChannelId";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useContinueWorking } from "@/hooks/useContinueWorking";
import { RecommendationCard } from "@/components/home/RecommendationCard";
import { ContinueWorking } from "@/components/home/ContinueWorking";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function DashboardPage() {
  const { channelId } = useChannelId();
  const { recommendations, loading: recsLoading } = useRecommendations();
  const { items: continueItems, loading: continueLoading } = useContinueWorking();

  const topRecommendation = useMemo(() => {
    if (recommendations.length === 0) return null;
    return [...recommendations].sort((a, b) => b.audienceMatch - a.audienceMatch)[0];
  }, [recommendations]);

  const brief = useDailyBrief({
    userName: "Creator",
    hasUnfinishedWork: continueItems.length > 0,
    unfinishedCaseName: continueItems[0]?.name,
    unfinishedProgress: continueItems[0]?.progress,
    newOpportunityScore: topRecommendation?.audienceMatch,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-8 pb-24 pt-20 sm:px-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {brief.greeting}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{brief.subline}</p>

        <div className="mt-14">
          {recsLoading ? (
            <div className="h-64 animate-pulse rounded-3xl bg-muted sm:h-80" />
          ) : topRecommendation ? (
            <RecommendationCard
              title={topRecommendation.title}
              reason={topRecommendation.reason}
              audienceMatch={topRecommendation.audienceMatch}
              caseId={slugify(topRecommendation.title)}
              allowVideo={!!channelId}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {channelId
                  ? "No recommendations yet — check back after your channel finishes analyzing."
                  : "Connect your channel to get personalized recommendations."}
              </p>
            </div>
          )}
        </div>

        {!continueLoading && continueItems.length > 0 && (
          <ContinueWorking items={continueItems} />
        )}
      </div>
    </div>
  );
}