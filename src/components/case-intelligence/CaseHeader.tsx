"use client";

import { useEffect, useRef, useState } from "react";
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ChevronDown,
  Mail,
  MessageCircle,
  Link2,
  Check,
  Loader2,
  X,
} from "lucide-react";
import type { CaseRow } from "@/hooks/useCase";

const ANGLE_TYPES = [
  { id: "victim-centered", label: "Victim-Centered" },
  { id: "investigative", label: "Investigative Deep-Dive" },
  { id: "systemic-failure", label: "Systemic / Institutional Failure" },
  { id: "family-impact", label: "Family & Community Impact" },
  { id: "courtroom", label: "Legal / Courtroom Drama" },
] as const;

interface GeneratedAngle {
  title: string;
  hook: string;
  rationale: string;
  keyBeats: string[];
}

export function CaseHeader({ caseData }: { caseData: CaseRow }) {
  // ---- Share dropdown ----
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // ---- Save Case ----
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ---- Generate Angle ----
  const [angleMenuOpen, setAngleMenuOpen] = useState(false);
  const [angleLoading, setAngleLoading] = useState(false);
  const [angleError, setAngleError] = useState<string | null>(null);
  const [angleResult, setAngleResult] = useState<GeneratedAngle | null>(null);
  const angleRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
      if (angleRef.current && !angleRef.current.contains(e.target as Node)) {
        setAngleMenuOpen(false);
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

  async function handleGenerateAngle(angleTypeId: string) {
    setAngleMenuOpen(false);
    setAngleLoading(true);
    setAngleError(null);
    setAngleResult(null);

    try {
      const res = await fetch("/api/case/generate-angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id, angleType: angleTypeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate angle");
      setAngleResult(data);
    } catch (err) {
      setAngleError(err instanceof Error ? err.message : "Failed to generate angle");
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
          {caseData.country && (
            <p className="mt-1 text-xs text-slate-500">{caseData.country}</p>
          )}
          {caseData.summary && (
            <p className="mt-2 max-w-2xl text-sm text-slate-400">{caseData.summary}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {/* Share */}
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

          {/* Save Case */}
          <button
            onClick={handleSaveCase}
            disabled={saveState === "saving"}
            title={saveError ?? undefined}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
          >
            {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveState === "saved" && <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />}
            {(saveState === "idle" || saveState === "error") && (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            {saveState === "saved"
              ? "Saved"
              : saveState === "saving"
                ? "Saving..."
                : saveState === "error"
                  ? "Retry Save"
                  : "Save Case"}
          </button>

          {/* Generate Angle */}
          <div className="relative" ref={angleRef}>
            <button
              onClick={() => setAngleMenuOpen((o) => !o)}
              disabled={angleLoading}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {angleLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {angleLoading ? "Generating..." : "Generate Angle"}
              <ChevronDown className="h-3 w-3" />
            </button>

            {angleMenuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
                {ANGLE_TYPES.map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => handleGenerateAngle(angle.id)}
                    className="flex w-full items-center px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {angle.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {angleError && (
        <p className="mt-3 text-xs text-rose-400">{angleError}</p>
      )}

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

      {/* Generated Angle modal */}
      {angleResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAngleResult(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-white">{angleResult.title}</h2>
              <button
                onClick={() => setAngleResult(null)}
                className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm italic text-blue-300">{angleResult.hook}</p>
            <p className="mt-3 text-sm text-slate-400">{angleResult.rationale}</p>

            {angleResult.keyBeats?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Key Beats to Explore
                </p>
                <ul className="space-y-1.5">
                  {angleResult.keyBeats.map((beat, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-blue-400">•</span> {beat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}