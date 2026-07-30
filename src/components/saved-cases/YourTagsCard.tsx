"use client";

import { YOUR_TAGS } from "@/constants/savedCases";

export function YourTagsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-white">Your Tags</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {YOUR_TAGS.map((tag) => (
          <span
            key={tag.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.color}`}
          >
            {tag.label} <span className="opacity-70">{tag.count}</span>
          </span>
        ))}
      </div>

      <button className="mt-3 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View All Tags →
      </button>
    </div>
  );
}