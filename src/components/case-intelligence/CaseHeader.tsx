"use client";

import { useEffect, useRef, useState } from "react";
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Mail,
  MessageCircle,
  Link2,
  Check,
  Loader2,
  X,
} from "lucide-react";
import type { CaseRow } from "@/hooks/useCase";
import { useChannelId } from "@/hooks/useChannelId";

const LENS_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

interface GeneratedAngle {
  lens: string;
  title: string;
  hook: string;
  rationale: string;
  keyBeats: string[];
}

export function CaseHeader({ caseData }: { caseData: CaseRow }) {
  const { channelId } = useChannelId();

  // ---- Share dropdown ----
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // ---- Save Case ----
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ---- Generate Angle ----
  const [angleLoading, setAngleLoading] = useState(false);
  const [angleError, setAngleError] = useState<string | null>(null);
  const [angleResults, setAngleResults] = useState<GeneratedAngle[] | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${caseData.name} — case research on VerityPulse`;

  function handleGmailShare() {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      shareText
    )}&body=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  function handleWhatsAppShare() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/local contexts; fall back silently.
    }
  }

  async function handleSaveCase() {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save case");
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save case");
    }
  }

  async function handleGenerateAngles() {
    setAngleLoading(true);
    setAngleError(null);
    setAngleResults(null);

    try {
      const res = await fetch("/api/case/generate-angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id, channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate angles");
      setAngleResults(data.angles ?? []);
    } catch (err) {
      setAngleError(err instanceof Error ? err.message : "Failed to generate angles");
    } finally {
      setAngleLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-start gap-5">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-800" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">{caseData.name}</h1>
            {caseData.category && (
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                {caseData.category}
              </span>
            )}
          </div>
          {caseData.country && <p className="mt-1 text-xs text-slate-500">{caseData.country}</p>}
          {caseData.summary && <p className="mt-2 max-w-2xl text-sm text-slate-400">{caseData.summary}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            {shareOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                <button
                  onClick={handleGmailShare}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  <Mail className="h-3.5 w-3.5" /> Gmail
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  {linkCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {linkCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveCase}
            disabled={saveState === "saving"}
            title={saveError ?? undefined}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
          >
            {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveState === "saved" && <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />}
            {(saveState === "idle" || saveState === "error") && <Bookmark className="h-3.5 w-3.5" />}
            {saveState === "saved"
              ? "Saved"
              : saveState === "saving"
                ? "Saving..."
                : saveState === "error"
                  ? "Retry Save"
                  : "Save Case"}
          </button>

          <button
            onClick={handleGenerateAngles}
            disabled={angleLoading}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {angleLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {angleLoading ? "Analyzing coverage..." : "Find Uncovered Angles"}
          </button>
        </div>
      </div>

      {angleError && <p className="mt-3 text-xs text-rose-400">{angleError}</p>}

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-800/60 pt-5">
        <div className="text-center">
          <p className="mb-1 text-[11px] text-slate-500">Opportunity Score</p>
          <div className="relative mx-auto h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="97.4"
                strokeDashoffset={97.4 * (1 - (caseData.opportunity_score ?? 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
              {caseData.opportunity_score ?? "—"}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">YouTube Coverage</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {caseData.coverage_score != null ? `${caseData.coverage_score}/10` : "—"}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">Competition Score</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {caseData.competition_score ?? "—"}{" "}
            <span className="text-[11px] font-normal text-slate-500">/100</span>
          </p>
        </div>
      </div>

      {angleResults && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAngleResults(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-white">
                {angleResults.length > 0 ? `${angleResults.length} Uncovered Angle${angleResults.length === 1 ? "" : "s"} Found` : "No Strong Angles Found"}
              </h2>
              <button
                onClick={() => setAngleResults(null)}
                className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {angleResults.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">
                Every lens appears well-covered on YouTube for this case already.
              </p>
            )}

            <div className="mt-4 space-y-4">
              {angleResults.map((angle, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="inline-block rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                    {LENS_LABELS[angle.lens] ?? angle.lens}
                  </span>
                  <p className="mt-2 font-display text-base font-bold text-white">{angle.title}</p>
                  <p className="mt-1.5 text-sm italic text-blue-300">{angle.hook}</p>
                  <p className="mt-2 text-sm text-slate-400">{angle.rationale}</p>
                  {angle.keyBeats?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {angle.keyBeats.map((beat, j) => (
                        <li key={j} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-blue-400">•</span> {beat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}