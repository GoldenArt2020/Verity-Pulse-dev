"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { OpportunityCardV2 } from "@/components/discover/OpportunityCardV2";
import { SkeletonCard } from "@/components/discover/SkeletonCard";
import { useCases } from "@/hooks/useCases";

export default function AllOpportunitiesPage() {
  const router = useRouter();
  const { cases, loading, error } = useCases();

  const researchedCases = cases
    .filter((c) => (c.opportunity_score ?? 0) > 0 && c.summary && c.summary.trim().length > 0)
    .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <button
        onClick={() => router.push("/discover")}
        className="flex items-center gap-1.5 text-sm font-medium text-[#71717A] hover:text-[#FAFAFA]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Discover
      </button>

      <h1 className="mt-4 text-3xl font-bold text-[#FAFAFA]">All Opportunities</h1>
      <p className="mt-1 text-sm text-[#71717A]">
        {researchedCases.length} case{researchedCases.length !== 1 ? "s" : ""} ranked by opportunity score
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading && [1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}

        {error && (
          <div className="col-span-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center text-sm text-[#A1A1AA]">
            We couldn&apos;t load opportunities right now.
          </div>
        )}

        {!loading && !error && researchedCases.length === 0 && (
          <div className="col-span-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-10 text-center">
            <p className="text-sm text-[#A1A1AA]">No opportunities yet.</p>
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
              score={c.opportunity_score ?? 0}
              audienceMatch={c.opportunity_score ?? 0}
            />
          ))}
      </div>
    </div>
  );
}