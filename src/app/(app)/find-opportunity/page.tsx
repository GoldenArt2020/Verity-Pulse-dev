"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { OpportunityCard } from "@/components/find-opportunity/OpportunityCard";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";
import { OPPORTUNITIES } from "@/constants/opportunities";
import { useChannelId } from "@/hooks/useChannelId";

const COLLECTIONS = [
  "Missing Persons",
  "Institutional Failures",
  "Cold Cases",
  "Organized Crime",
  "Police Corruption",
  "County Lines",
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const { channelId, channelHandle } = useChannelId();

  if (!channelId) {
    return <ChannelOnboarding />;
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
          <p className="mt-2 text-lg text-[#A1A1AA]">Find your next documentary opportunity.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#71717A]">Current Channel</p>
          <p className="text-sm font-semibold text-[#FAFAFA]">@{channelHandle}</p>
        </div>
      </div>

      <div className="relative mt-10">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717A]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cases, victims, suspects, locations..."
          className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#18181B] pl-14 pr-5 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none"
        />
      </div>

      <div className="mt-14">
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Today&apos;s Opportunities</h2>
        <div className="mt-5 space-y-4">
          {OPPORTUNITIES.map((o) => (
            <OpportunityCard key={o.title} {...o} />
          ))}
        </div>
      </div>

      <div className="mt-14">
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Collections</h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {COLLECTIONS.map((c) => (
            <button
              key={c}
              className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
            >
              <p className="font-semibold text-[#FAFAFA]">{c}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}