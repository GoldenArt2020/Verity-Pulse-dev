"use client";

import { Bookmark } from "lucide-react";
import { SavedCasesTopBarActions } from "@/components/saved-cases/SavedCasesTopBarActions";
import { SavedCasesStatCard } from "@/components/saved-cases/SavedCasesStatCard";
import { SavedCasesFilterBar } from "@/components/saved-cases/SavedCasesFilterBar";
import { SavedCasesTable } from "@/components/saved-cases/SavedCasesTable";
import { SavedCasesOverviewDonut } from "@/components/saved-cases/SavedCasesOverviewDonut";
import { TopCategoryBreakdown } from "@/components/saved-cases/TopCategoryBreakdown";
import { YourTagsCard } from "@/components/saved-cases/YourTagsCard";
import { AIRecommendationsCard } from "@/components/saved-cases/AIRecommendationsCard";
import { SAVED_CASES_STATS } from "@/constants/savedCases";

export default function SavedCasesPage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <div>
          <h1 className="font-display text-lg font-bold text-white">Saved Cases</h1>
          <p className="text-xs text-slate-500">
            Your watchlist of cases, opportunities, and research in progress.
          </p>
        </div>
        <SavedCasesTopBarActions />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {SAVED_CASES_STATS.map((s) => (
              <SavedCasesStatCard key={s.key} icon={s.icon as any} label={s.label} value={s.value} sub={s.sub} color={s.color} />
            ))}
          </div>

          <SavedCasesFilterBar />

          <SavedCasesTable />
        </div>

        <div className="space-y-4">
          <SavedCasesOverviewDonut />
          <TopCategoryBreakdown />
          <YourTagsCard />
          <AIRecommendationsCard />
        </div>
      </div>
    </div>
  );
}