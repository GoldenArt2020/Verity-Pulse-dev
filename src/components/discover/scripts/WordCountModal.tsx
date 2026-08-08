"use client";

import { X } from "lucide-react";
import type { WordCountOption } from "@/hooks/useScriptGeneration";

const OPTIONS: { value: WordCountOption; label: string; blurb: string }[] = [
  { value: 5000, label: "5,000 words", blurb: "~30-35 min narration. Tighter, faster-paced episode." },
  { value: 10000, label: "10,000 words", blurb: "~60-70 min narration. Standard full-length deep dive." },
  { value: 15000, label: "15,000 words", blurb: "~90-100 min narration. Full investigative feature." },
];

export function WordCountModal({
  angleTitle,
  onSelect,
  onCancel,
}: {
  angleTitle: string;
  onSelect: (wordCount: WordCountOption) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-[rgb(8,13,28)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Choose script length</h3>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{angleTitle}</p>
          </div>
          <button onClick={onCancel} className="shrink-0 text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="w-full rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 text-left transition-colors hover:border-blue-500/50 hover:bg-blue-500/5"
            >
              <p className="text-sm font-semibold text-white">{opt.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{opt.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}