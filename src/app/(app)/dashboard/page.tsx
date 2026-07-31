"use client";

import { useDailyBrief } from "@/hooks/useDailyBrief";
import { RecommendationCard } from "@/components/home/RecommendationCard";
import { ContinueWorking } from "@/components/home/ContinueWorking";

// TODO: replace with real Case/Project data once available
const MOCK_RECOMMENDATION = {
  caseId: "andrew-gosden",
  title: "The Disappearance of Andrew Gosden",
  description:
    "High search momentum following renewed public interest while long-form competition remains unusually low.",
  imageUrl: "/images/andrew-gosden.jpg",
  opportunityScore: 92,
  opportunityLabel: "Exceptional",
  searchGrowth: "+240%",
  competition: "Low",
  potentialViews: "120K – 380K",
  aiConfidence: 96,
};

const MOCK_CONTINUE_WORKING = [
  {
    id: "1",
    name: "Andrew Gosden",
    phase: "Research phase",
    progress: 72,
    lastEdited: "Last edited 2 hours ago",
    imageUrl: "/images/andrew-gosden.jpg",
    href: "/research/andrew-gosden",
  },
  {
    id: "2",
    name: "Jeremy Bamber",
    phase: "Script phase",
    progress: 43,
    lastEdited: "Last edited yesterday",
    imageUrl: "/images/jeremy-bamber.jpg",
    href: "/create/jeremy-bamber",
  },
  {
    id: "3",
    name: "Ashley Dale",
    phase: "Optimization phase",
    progress: 91,
    lastEdited: "3 days ago",
    imageUrl: "/images/ashley-dale.jpg",
    href: "/optimize/ashley-dale",
  },
];

export default function DashboardPage() {
  const brief = useDailyBrief({
    userName: "Creator",
    hasUnfinishedWork: true,
    unfinishedCaseName: "Andrew Gosden",
    unfinishedProgress: 72,
    newOpportunityScore: MOCK_RECOMMENDATION.opportunityScore,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-8 pb-24 pt-20 sm:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
          {brief.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {brief.greeting}
        </h1>
        <p className="mt-3 text-lg text-slate-500">{brief.subline}</p>

        <div className="mt-14">
          <RecommendationCard {...MOCK_RECOMMENDATION} />
        </div>

        <ContinueWorking items={MOCK_CONTINUE_WORKING} />
      </div>
    </div>
  );
}