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
  score: number;
  audienceMatch: number;
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
  score,
  audienceMatch,
}: OpportunityCardV2Props) {
  const router = useRouter();
  const { url: imageUrl, loading: imageLoading } = useCaseVisual(id, category, false);

  return (
    <button
      onClick={() => router.push(`/case-analyzer/${id}`)}
      className="group flex h-[220px] w-[260px] sm:w-[280px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#111114] text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
    >
      <div className="relative h-24 w-full shrink-0 overflow-hidden bg-[#18181B]">
        {imageUrl && !imageLoading && (
          <Image src={imageUrl} alt="" fill sizes="280px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-bold text-white">
          #{rank}
        </span>
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:text-blue-400"
        >
          <Bookmark className="h-3 w-3" />
        </span>
        <div
          className="absolute -bottom-4 right-3 flex h-9 w-9 items-center justify-center rounded-full border-[3px] text-xs font-bold text-white"
          style={{ borderColor: scoreColor(score), backgroundColor: "#0B0B0D" }}
        >
          {score}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 pt-5 min-w-0 w-full">
        <p className="truncate text-[13px] font-semibold text-[#FAFAFA]">{title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[#71717A]">{location}</p>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px]">
          <span className="text-[#71717A]">Match</span>
          <span className="font-medium text-emerald-400">{audienceMatch}%</span>
        </div>
      </div>
    </button>
  );
}