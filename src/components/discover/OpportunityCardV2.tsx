"use client";

import { useRouter } from "next/navigation";
import { Bookmark, Users, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  audienceMatch: number;
}

function scoreColor(score: number) {
  return score >= 90 ? "#10B981" : score >= 75 ? "#34D399" : score >= 50 ? "#F59E0B" : "#F43F5E";
}

function TrendIcon({ trend }: { trend: "Rising" | "Steady" | "Falling" }) {
  if (trend === "Rising") return <TrendingUp className="h-3 w-3 shrink-0" />;
  if (trend === "Falling") return <TrendingDown className="h-3 w-3 shrink-0" />;
  return <Minus className="h-3 w-3 shrink-0" />;
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
  audienceMatch,
}: OpportunityCardV2Props) {
  const router = useRouter();
  const { url: imageUrl, loading: imageLoading } = useCaseVisual(id, category, false);

  return (
    <button
      onClick={() => router.push(`/case-analyzer/${id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111114] text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
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

        <div className="mt-3 grid grid-cols-3 gap-1 border-t border-white/[0.06] pt-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] text-[#71717A]">Audience Match</p>
            <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-emerald-400">
              <Users className="h-3 w-3 shrink-0" />
              {audienceMatch}%
            </p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] text-[#71717A]">Competition</p>
            <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-[#FAFAFA]">
              <BarChart3 className="h-3 w-3 shrink-0" />
              {competition}
            </p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] text-[#71717A]">Search Trend</p>
            <p
              className={`mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] font-medium ${
                searchTrend === "Rising" ? "text-emerald-400" : "text-[#FAFAFA]"
              }`}
            >
              <TrendIcon trend={searchTrend} />
              {searchTrend}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}