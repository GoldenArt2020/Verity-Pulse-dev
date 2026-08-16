"use client";

import { Loader2, X } from "lucide-react";

const WORD_COUNT_OPTIONS = [3000, 5000, 10000] as const;

const LABELS: Record<(typeof WORD_COUNT_OPTIONS)[number], { title: string; sub: string }> = {
  3000: { title: "3,000 words", sub: "~18-20 min narration · short, tight episode" },
  5000: { title: "5,000 words", sub: "~30 min narration · standard episode" },
  10000: { title: "10,000 words", sub: "~60 min narration · extended, in-depth episode" },
};

export function SendToClaudeDialog({
  open,
  onClose,
  onSelect,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (wordCount: number) => void;
  busy?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-800/60 bg-slate-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Choose script length</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Prepares a job with this word count target, bundled with case facts, background profiles, and your
          production bible — ready to paste into Claude.
        </p>

        <div className="mt-4 space-y-2">
          {WORD_COUNT_OPTIONS.map((wc) => (
            <button
              key={wc}
              disabled={busy}
              onClick={() => onSelect(wc)}
              className="flex w-full flex-col items-start rounded-xl border border-slate-800/60 bg-slate-800/40 px-3.5 py-2.5 text-left transition-colors hover:border-purple-500/60 hover:bg-purple-500/10 disabled:opacity-50"
            >
              <span className="text-sm font-semibold text-white">{LABELS[wc].title}</span>
              <span className="text-[11px] text-slate-400">{LABELS[wc].sub}</span>
            </button>
          ))}
        </div>

        {busy && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing job...
          </div>
        )}
      </div>
    </div>
  );
}