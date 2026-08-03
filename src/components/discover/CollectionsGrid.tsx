"use client";

import { useRouter } from "next/navigation";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";
import { useMediaImage } from "@/hooks/useMediaImage";
import { ArrowRight } from "lucide-react";

const MOOD_QUERY: Record<string, string> = {
  "Missing Person": "dark missing person silhouette street",
  "Missing Persons": "dark missing person silhouette street",
  "Institutional Failures": "dark courthouse building night",
  "Organized Crime": "rainy city street night crime",
  "Murder Investigation": "police tape crime scene night",
  "Police Corruption": "police lights blue red night",
  "Cold Cases": "evidence board cork board pins",
};
const DEFAULT_QUERY = "dark investigation mystery";

function CollectionTile({ label, count }: { label: string; count: number }) {
  const router = useRouter();
  const { url } = useMediaImage(MOOD_QUERY[label] ?? DEFAULT_QUERY);

  return (
    <button
      onClick={() => router.push(`/discover/collection/${encodeURIComponent(label)}`)}
      className="group relative h-40 w-[200px] sm:w-[240px] shrink-0 overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111114] text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-200 group-hover:from-black/90" />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold text-white transition-colors duration-200 group-hover:text-blue-300">
          {label}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-white/70">
            {count} case{count === 1 ? "" : "s"}
          </p>
          <ArrowRight className="h-3.5 w-3.5 text-white/70 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );
}

export function CollectionsGrid() {
  const { categories, loading } = useCategoryCounts();

  if (loading) {
    return (
      <div className="flex w-full min-w-0 max-w-full gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-40 w-[200px] sm:w-[240px] shrink-0 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="w-full rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center">
        <p className="text-sm text-[#A1A1AA]">No categorized cases yet.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 max-w-full gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <CollectionTile key={c.label} label={c.label} count={c.count} />
      ))}
    </div>
  );
}