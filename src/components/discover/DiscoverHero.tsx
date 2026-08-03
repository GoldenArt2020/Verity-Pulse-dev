"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FileText, ArrowRight } from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { useMediaImage } from "@/hooks/useMediaImage";
import { getOrCreateCase } from "@/services/getOrCreateCase";

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  country?: string;
  category?: string;
  opportunity_score?: number;
}

export function DiscoverHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const { cases } = useCases();
  const { url: heroImage } = useMediaImage("detective evidence board dark room investigation");

  const highConfidenceCount = cases.filter((c) => (c.opportunity_score ?? 0) >= 85).length;

  // Real-time live search against cases
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to hide dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelectCase(caseId: string) {
    setIsOpening(true);
    setShowDropdown(false);
    router.push(`/case-analyzer/${caseId}`);
  }

  async function handleDirectSearch() {
    if (!query.trim()) return;
    setIsOpening(true);
    setShowDropdown(false);
    try {
      const stub = await getOrCreateCase(query.trim());
      router.push(`/case-analyzer/${stub.id}`);
    } catch {
      setIsOpening(false);
    }
  }

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-2xl p-6 sm:p-8">
      {/* Background image layer */}
      {heroImage && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            style={{ opacity: 0.28 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #0A0E1A 35%, rgba(10,14,26,0.2) 75%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* Content layer */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-[#FAFAFA] sm:text-[40px]">Discover</h1>
        <p className="mt-2 text-base text-[#A1A1AA]">
          Good morning, <span className="text-blue-400">Creator</span>.
        </p>
        <p className="mt-1 text-sm text-[#71717A]">
          The intelligence engine has analyzed your channel overnight.{" "}
          {highConfidenceCount > 0 && (
            <span className="font-medium text-blue-400">
              {highConfidenceCount} high-confidence opportunit
              {highConfidenceCount === 1 ? "y" : "ies"} found.
            </span>
          )}
        </p>

        {/* Live Search Bar */}
        <div ref={searchRef} className="relative mt-8 max-w-2xl">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-blue-400" />
            ) : (
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71717A]" />
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              onKeyDown={(e) => e.key === "Enter" && handleDirectSearch()}
              placeholder="Search cases, people, organisations, locations..."
              className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#111114] pl-14 pr-24 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#71717A]">
              ⌘K
            </kbd>
          </div>

          {/* Real Cases Auto-complete Results Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-16 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl backdrop-blur-xl">
              {results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-2">
                  <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#71717A] uppercase">
                    Matching Cases
                  </div>
                  {results.map((c) => {
                    const caseTitle = c.name || c.title || "Untitled Case";
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCase(c.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#18181C] text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#FAFAFA]">
                              {caseTitle}
                            </p>
                            <p className="truncate text-xs text-[#71717A]">
                              {c.country || "General"} {c.category ? `• ${c.category}` : ""}
                            </p>
                          </div>
                        </div>
                        {c.opportunity_score !== undefined && (
                          <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            {c.opportunity_score}% Match
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-[#A1A1AA]">No matching existing cases found.</p>
                  <button
                    onClick={handleDirectSearch}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Research &quot;{query}&quot; with AI <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isOpening && <p className="mt-2 text-xs text-blue-400 animate-pulse">Opening case research…</p>}
      </div>
    </div>
  );
}