"use client";

import { useDailyBrief } from "@/hooks/useDailyBrief";
import { RecommendationCard } from "@/components/home/RecommendationCard";
import { ContinueWorking } from "@/components/home/ContinueWorking";

const MOCK_RECOMMENDATION = {
  caseId: "andrew-gosden",
  category: "missing-person" as const,
  title: "The Disappearance of Andrew Gosden",
  description:
    "High search momentum following renewed public interest while long-form competition remains unusually low.",
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
    category: "missing-person" as const,
    phase: "Research",
    phaseColor: "#7C3AED",
    progress: 72,
    lastEdited: "2 hours ago",
    href: "/research/andrew-gosden",
  },
  {
    id: "2",
    name: "Jeremy Bamber",
    category: "court-case" as const,
    phase: "Script",
    phaseColor: "#F97316",
    progress: 43,
    lastEdited: "Yesterday",
    href: "/create/jeremy-bamber",
  },
  {
    id: "3",
    name: "Ashley Dale",
    category: "unsolved-murder" as const,
    phase: "Optimization",
    phaseColor: "#16A34A",
    progress: 91,
    lastEdited: "3 days ago",
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
        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
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