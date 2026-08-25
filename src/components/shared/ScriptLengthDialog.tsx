"use client";

import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { SCRIPT_WORD_COUNT_OPTIONS, type ScriptWordCount } from "@/constants/scriptOptions";

const LABELS: Record<ScriptWordCount, { title: string; sub: string }> = {
  5000: { title: "5,000 words", sub: "~30 min narration · tight, fast-moving, strongest evidence only" },
  7000: { title: "7,000 words", sub: "~42 min narration · deeper investigation, fuller context" },
  10000: { title: "10,000 words", sub: "~60 min narration · full investigation, competing theories, courtroom depth" },
};

export function ScriptLengthDialog({
  open,
  onClose,
  onSelect,
  busy,
  progressLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (wordCount: ScriptWordCount) => void;
  busy?: boolean;
  progressLabel?: string | null;
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-800/60 bg-slate-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Choose script length</h3>
          {!busy && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Each length is written with genuine additional depth, not padding — pick what fits the story.
        </p>

        <div className="mt-4 space-y-2">
          {SCRIPT_WORD_COUNT_OPTIONS.map((wc) => (
            <button
              key={wc}
              disabled={busy}
              onClick={() => onSelect(wc)}
              className="flex w-full flex-col items-start rounded-xl border border-slate-800/60 bg-slate-800/40 px-3.5 py-2.5 text-left transition-colors hover:border-blue-500/60 hover:bg-blue-500/10 disabled:opacity-50"
            >
              <span className="text-sm font-semibold text-white">{LABELS[wc].title}</span>
              <span className="text-[11px] text-slate-400">{LABELS[wc].sub}</span>
            </button>
          ))}
        </div>

        {busy && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-300">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-400" />
            {progressLabel ?? "Writing your script — this can take a minute or two for longer scripts..."}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}