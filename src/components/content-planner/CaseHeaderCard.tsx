"use client";

import { ExternalLink } from "lucide-react";
import { CASE_HEADER } from "@/constants/contentPlannerWorkflow";

export function CaseHeaderCard() {
  return (
    <div className="flex items-start gap-4">
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-slate-800">
        {CASE_HEADER.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={CASE_HEADER.image}
            alt={CASE_HEADER.name}
            className="h-full w-full object-cover grayscale"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-800" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display truncate text-lg font-bold text-white">
            {CASE_HEADER.name}
          </h2>
          <span className="shrink-0 rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
            {CASE_HEADER.tag}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-400">
          <span>{CASE_HEADER.location}</span>
          <span className="text-slate-600">•</span>
          <span>{CASE_HEADER.date}</span>
          <span className="text-slate-600">•</span>
          <span>{CASE_HEADER.age}</span>
        </div>

        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">
          {CASE_HEADER.description}
        </p>

        <button className="mt-2 flex items-center gap-1 text-[12px] font-medium text-blue-400 hover:text-blue-300">
          View Case Dossier <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}