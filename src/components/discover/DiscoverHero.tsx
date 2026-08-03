"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useMediaImage } from "@/hooks/useMediaImage";
import { useCases } from "@/hooks/useCases";
import { getOrCreateCase } from "@/services/getOrCreateCase";

export function DiscoverHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const { url: heroImage } = useMediaImage("detective evidence board dark room investigation");
  const { cases } = useCases();

  const highConfidenceCount = cases.filter((c) => (c.opportunity_score ?? 0) >= 85).length;

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const stub = await getOrCreateCase(query.trim());
      router.push(`/case-analyzer/${stub.id}`);
    } catch {
      setSearching(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
        <p className="mt-2 text-base text-[#A1A1AA]">
          Good morning, <span className="text-blue-400">Creator</span>.
        </p>
        <p className="mt-1 text-sm text-[#71717A]">
          The intelligence engine has analyzed your channel overnight.{" "}
          {highConfidenceCount > 0 && (
            <span className="font-medium text-blue-400">
              {highConfidenceCount} high-confidence opportunit{highConfidenceCount === 1 ? "y" : "ies"} found.
            </span>
          )}
        </p>

        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717A]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search cases, people, organisations, locations..."
            className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#111114] pl-14 pr-24 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#71717A]">
            ⌘K
          </kbd>
        </div>
        {searching && <p className="mt-2 text-xs text-[#71717A]">Opening case…</p>}
      </div>

      <div className="relative hidden overflow-hidden rounded-2xl bg-[#111114] lg:block">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
    </div>
  );
}