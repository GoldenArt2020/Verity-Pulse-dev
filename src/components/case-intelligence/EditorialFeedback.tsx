// src/components/case-intelligence/EditorialFeedback.tsx
"use client";

import type { EditorialFeedbackData } from "@/services/coverageAnalysis";

export function EditorialFeedback({ data, loading }: { data: EditorialFeedbackData | null; loading: boolean }) {
  return (
    <div className="rounded-[18px] border border-blue-500/20 bg-blue-500/[0.03] p-6">
      <h3 className="text-sm font-semibold text-blue-400">Verity Editorial Feedback</h3>

      {loading && <div className="mt-3 h-20 animate-pulse rounded-xl bg-white/[0.03]" />}

      {!loading && !data && <p className="mt-3 text-sm text-[#71717A]">No feedback generated yet.</p>}

      {!loading && data && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
            We analyzed {data.videosAnalyzed} YouTube videos about this case.
          </p>
          <ul className="mt-2 space-y-1">
            {data.points.map((p) => (
              <li key={p} className="text-sm text-[#A1A1AA]">· {p}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-[#FAFAFA]">{data.conclusion}</p>
        </>
      )}
    </div>
  );
}