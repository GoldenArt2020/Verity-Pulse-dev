"use client";

import Link from "next/link";
import { RECOMMENDED_FOR_YOU } from "@/constants/creatorDNA";

export function RecommendedForYou() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#FAFAFA]">Recommended For You</h2>
      <div className="mt-5 space-y-3">
        {RECOMMENDED_FOR_YOU.map((r) => (
          <Link
            key={r.title}
            href={`/case-analyzer/${encodeURIComponent(r.title)}`}
            className="group block rounded-[18px] border border-white/[0.06] bg-[#111114] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#FAFAFA]">{r.title}</p>
              <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-400">
                {r.audienceMatch}% Match
              </span>
            </div>
            <p className="mt-2 text-sm text-[#A1A1AA]">{r.reason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}