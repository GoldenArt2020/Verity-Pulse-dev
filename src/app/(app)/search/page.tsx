"use client";

import { GlobalSearchTopBar } from "@/components/global-search/GlobalSearchTopBar";
import { SearchTabs } from "@/components/global-search/SearchTabs";
import { SearchResultsList } from "@/components/global-search/SearchResultsList";
import { SearchFiltersCard } from "@/components/global-search/SearchFiltersCard";
import { RecentSearchesCard } from "@/components/global-search/RecentSearchesCard";
import { SavedSearchesCard } from "@/components/global-search/SavedSearchesCard";
import { SearchTipsBar } from "@/components/global-search/SearchTipsBar";

export default function GlobalSearchPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <GlobalSearchTopBar />
      <SearchTabs />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SearchResultsList />
        </div>
        <div className="flex flex-col gap-6">
          <SearchFiltersCard />
          <RecentSearchesCard />
          <SavedSearchesCard />
        </div>
      </div>

      <SearchTipsBar />
    </div>
  );
}