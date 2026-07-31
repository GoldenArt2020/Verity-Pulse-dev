"use client";

import { Compass, LayoutGrid, LayoutList, Bookmark } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { FiltersPanel } from "@/components/find-opportunity/FiltersPanel";
import { OpportunityCard } from "@/components/find-opportunity/OpportunityCard";
import { useCases } from "@/hooks/useCases";

const TABS = ["High Opportunity", "Trending Now", "Rising Searches", "Low Competition", "Your Niche Fit"];

export default function FindOpportunityPage() {
  const { cases, loading, error } = useCases();

  return (
    <div>
      <TopBar
        title="Find Opportunity"
        subtitle="Discover high-opportunity true crime cases backed by data, not guesswork."
        icon={<Compass className="h-4.5 w-4.5" />}
      />

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-6 border-b border-slate-800/60">
            {TABS.map((t, i) => (
              <button
                key={t}
                className={`pb-3 text-sm font-medium ${
                  i === 0 ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98]">
            <Bookmark className="h-4 w-4" /> Save Search
          </button>
        </div>

        <div className="mt-5 flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-white">{cases.length} Opportunities Found</span>
              </p>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-200">
                  <LayoutList className="h-4 w-4" />
                </button>
                <button className="rounded-lg bg-blue-500 p-2 text-white">
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />
                  ))}
                </>
              )}

              {error && (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                  We couldn't load opportunities right now. <button className="text-blue-400 hover:text-blue-300">Retry</button>
                </div>
              )}

              {!loading && !error && cases.length === 0 && (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10 text-center">
                  <p className="text-sm text-slate-400">No opportunities yet.</p>
                </div>
              )}

              {!loading && !error && cases.map((c) => (
                <OpportunityCard
                  key={c.id}
                  id={c.id}
                  score={c.opportunityScore ?? 0}
                  title={c.name}
                  location={c.country ?? ""}
                  category={c.category ?? ""}
                  description={c.summary ?? ""}
                  competitionScore={c.competitionScore ?? 0}
                />
              ))}
            </div>
          </div>

          <FiltersPanel />
        </div>
      </div>
    </div>
  );
}