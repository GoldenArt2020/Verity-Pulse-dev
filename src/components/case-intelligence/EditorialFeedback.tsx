"use client";

import { EDITORIAL_FEEDBACK } from "@/constants/coverageIntelligence";

export function EditorialFeedback() {
  return (
    <div className="rounded-[18px] border border-blue-500/20 bg-blue-500/[0.03] p-6">
      <h3 className="text-sm font-semibold text-blue-400">Verity Editorial Feedback</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
        We analyzed {EDITORIAL_FEEDBACK.videosAnalyzed} YouTube videos about this case.
      </p>
      <ul className="mt-2 space-y-1">
        {EDITORIAL_FEEDBACK.points.map((p) => (
          <li key={p} className="text-sm text-[#A1A1AA]">· {p}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-[#FAFAFA]">{EDITORIAL_FEEDBACK.conclusion}</p>
    </div>
  );
}