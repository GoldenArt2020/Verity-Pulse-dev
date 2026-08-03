"use client";

import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useCaseVisual } from "@/hooks/useCaseVisual";

interface OpportunityCardV2Props {
  rank: number;
  id: string;
  title: string;
  location: string;
  category: string;
  description: string;
  score: number;
  competition: string;
  searchTrend: "Rising" | "Steady" | "Falling";
}

function scoreColor(score: number) {
  return score >= 90 ? "#10B981" : score >= 75 ? "#34D399" : score >= 50 ? "#F59E0B" : "#F43F5E";
}

export function OpportunityCardV2({
  rank,
  id,
  title,
  location,
  category,
  description,
  score,
  competition,
  searchTrend,
}: OpportunityCardV2Props) {
  const router = useRouter();
  const { url: imageUrl, loading: imageLoading } = useCaseVisual(id, category, false);

  return (
    <button
      onClick={() => router.push(`/case-analyzer/${id}`)}
      className="group flex w-72 shrink-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111114] text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
    >
      <div className="relative h-36 w-full overflow-hidden bg-[#18181B]">
        {imageUrl && !imageLoading && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-bold text-white">
          #{rank}
        </span>
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:text-blue-400"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </span>
        <div
          className="absolute -bottom-5 right-4 flex h-12 w-12 items-center justify-center rounded-full border-4 font-bold text-white"
          style={{ borderColor: scoreColor(score), backgroundColor: "#0B0B0D" }}
        >
          {score}
        </div>
      </div>

      <div className="p-4 pt-6">
        <p className="font-semibold text-[#FAFAFA]">{title}</p>
        <p className="mt-0.5 text-xs text-[#71717A]">{location}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA]">{description}</p>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
          <div>
            <p className="text-[10px] text-[#71717A]">Competition</p>
            <p className="font-medium text-[#FAFAFA]">{competition}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#71717A]">Search Trend</p>
            <p className={`font-medium ${searchTrend === "Rising" ? "text-emerald-400" : "text-[#FAFAFA]"}`}>
              {searchTrend}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}