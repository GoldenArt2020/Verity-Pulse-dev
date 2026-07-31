"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface RecommendationCardProps {
  title: string;
  description: string;
  imageUrl: string;
  opportunityScore: number;
  opportunityLabel: string;
  searchGrowth: string;
  competition: string;
  potentialViews: string;
  aiConfidence: number;
  caseId: string;
}

export function RecommendationCard({
  title,
  description,
  imageUrl,
  opportunityScore,
  opportunityLabel,
  searchGrowth,
  competition,
  potentialViews,
  aiConfidence,
  caseId,
}: RecommendationCardProps) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(`/research/${caseId}`)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative w-full overflow-hidden rounded-3xl bg-[#0B1120] p-10 text-left shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.32)]"
    >
      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-purple-400">
            Today&apos;s recommendation
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-white">
            {title}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-slate-400">
            {description}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            <Stat label="Opportunity score" value={String(opportunityScore)} emphasize sub={opportunityLabel} />
            <Stat label="Search growth" value={searchGrowth} sub="vs last 30 days" />
            <Stat label="Competition" value={competition} sub="Very few long-form videos" />
            <Stat label="Potential views" value={potentialViews} sub="Estimated range" />
          </div>
        </div>

        <div className="relative hidden overflow-hidden rounded-2xl lg:block">
          <Image src={imageUrl} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      <div className="absolute right-6 top-6 z-10 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          AI confidence
        </p>
        <p className="text-xl font-semibold text-white">{aiConfidence}%</p>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white transition-transform duration-200 group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </div>
    </motion.button>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasize = false,
}: {
  label: string;
  value: string;
  sub: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${emphasize ? "text-purple-400" : "text-white"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}