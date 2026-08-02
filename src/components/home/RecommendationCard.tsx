"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { CaseVisual, type CaseCategory } from "./CaseVisual";

interface RecommendationCardProps {
  title: string;
  reason: string;
  audienceMatch: number;
  caseId: string;
  category?: CaseCategory;
  allowVideo?: boolean;
}

export function RecommendationCard({
  title,
  reason,
  audienceMatch,
  caseId,
  category = "general",
  allowVideo = false,
}: RecommendationCardProps) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(`/research/${caseId}`)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative w-full overflow-hidden rounded-3xl bg-[#0B1120] text-left shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.32)]"
    >
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        <CaseVisual
          caseId={caseId}
          category={category}
          description={reason}
          allowVideo={allowVideo}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/10 to-transparent" />

        <p className="absolute left-8 top-6 text-xs font-medium uppercase tracking-wider text-purple-400">
          Today&apos;s recommendation
        </p>

        <div className="absolute right-6 top-6 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-right backdrop-blur-sm">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Audience match
          </p>
          <p className="text-xl font-semibold text-white">{audienceMatch}%</p>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-400">
          {reason}
        </p>
      </div>

      <div className="absolute bottom-8 right-8 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white transition-transform duration-200 group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </div>
    </motion.button>
  );
}