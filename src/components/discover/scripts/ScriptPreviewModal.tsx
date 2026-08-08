"use client";

import { useState } from "react";
import { Copy, Check, Loader2, X, FolderOpen } from "lucide-react";
import type { ScriptSeoSummary } from "@/services/scriptWriter";

export function ScriptPreviewModal({
  script,
  wordCount,
  seo,
  primaryLabel = "Open in Project",
  primaryLoading = false,
  onPrimaryAction,
  onClose,
}: {
  script: string;
  wordCount: number;
  seo: ScriptSeoSummary | null;
  primaryLabel?: string;
  primaryLoading?: boolean;
  onPrimaryAction: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const actualWordCount = script.trim().split(/\s+/).filter(Boolean).length;

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-800/60 bg-[rgb(8,13,28)]">
        <div className="flex items-center justify-between border-b border-slate-800/60 p-5">
          <div>
            <h3 className="text-base font-semibold text-white">Script ready</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Target {wordCount.toLocaleString()} words &middot; {actualWordCount.toLocaleString()} words generated
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {seo && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold text-emerald-400">SEO Snapshot (for your video upload)</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{seo.description}</p>
              {seo.keywords?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {seo.keywords.map((k) => (
                    <span key={k} className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="whitespace-pre-wrap rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
            {script}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 p-5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy script"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50"
            >
              Close
            </button>
            <button
              onClick={onPrimaryAction}
              disabled={primaryLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {primaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
              {primaryLoading ? "Opening..." : primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}