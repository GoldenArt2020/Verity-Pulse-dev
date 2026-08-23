"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import {
  type EditorialDNA,
  CHANNEL_PURPOSE_OPTIONS,
  CASE_AGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  EDITORIAL_LENS_OPTIONS,
  TITLE_PRIORITY_OPTIONS,
  THUMBNAIL_PRIORITY_OPTIONS,
  GOAL_OPTIONS,
  BOUNDARY_OPTIONS,
  GEOGRAPHY_OPTIONS,
} from "@/services/editorialDNA";

type Draft = Partial<EditorialDNA>;

function ChipGroup({
  options,
  selected,
  onToggle,
  allowCustom = true,
  color = "blue",
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  allowCustom?: boolean;
  color?: "blue" | "emerald" | "rose";
}) {
  const [custom, setCustom] = useState("");
  const activeClass =
    color === "emerald"
      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
      : color === "rose"
      ? "bg-rose-500/20 border-rose-500 text-rose-300"
      : "bg-blue-500/20 border-blue-500 text-blue-300";

  const allOptions = Array.from(new Set([...options, ...selected]));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? activeClass : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div className="mt-2 flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && custom.trim()) {
                onToggle(custom.trim());
                setCustom("");
              }
            }}
            placeholder="Add your own..."
            className="h-8 flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-200 outline-none focus:border-blue-500/50"
          />
          <button
            type="button"
            onClick={() => {
              if (custom.trim()) {
                onToggle(custom.trim());
                setCustom("");
              }
            }}
            className="rounded-lg border border-slate-700 px-2 text-slate-400 hover:text-slate-200"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function toggleIn(list: string[] | undefined, value: string): string[] {
  const arr = list ?? [];
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const STEP_LABELS = [
  "Channel Purpose",
  "Case Fit",
  "Geography & Timeframe",
  "Editorial Lens",
  "Differentiation",
  "Titles, Thumbnails & Goals",
  "Boundaries & Promise",
];

export function ChannelDNAWizard({
  channelId,
  channelName,
  initialSuggestion,
  onComplete,
}: {
  channelId: string;
  channelName: string;
  initialSuggestion: Draft;
  onComplete: (dna: EditorialDNA) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialSuggestion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EditorialDNA>(key: K, value: EditorialDNA[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return (draft.channelPurpose?.length ?? 0) > 0 && !!draft.channelIdentity?.trim();
      case 5:
        return !!draft.primaryGoal;
      default:
        return true;
    }
  })();

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/channel/${channelId}/editorial-dna`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorialDna: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save Channel DNA");
      onComplete(data.editorialDna);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-400">Define Your Channel</p>
              <h2 className="text-lg font-semibold text-white">{channelName}</h2>
            </div>
            <span className="text-xs text-slate-500">
              {step + 1} / {STEP_LABELS.length}
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-slate-800"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">What is this channel about?</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Every channel has its own identity — this tailors case discovery, angles, and titles to it.
                    </p>
                    <div className="mt-3">
                      <ChipGroup
                        options={CHANNEL_PURPOSE_OPTIONS}
                        selected={draft.channelPurpose ?? []}
                        onToggle={(v) => set("channelPurpose", toggleIn(draft.channelPurpose, v))}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">What should this channel be known for?</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Not just a niche — the editorial identity. e.g. "We investigate disappearances where the
                      timeline doesn't add up."
                    </p>
                    <textarea
                      value={draft.channelIdentity ?? ""}
                      onChange={(e) => set("channelIdentity", e.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                      placeholder="Describe it in your own words..."
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">What belongs on this channel? (Core)</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={CASE_STATUS_OPTIONS}
                        selected={draft.coreContent ?? []}
                        onToggle={(v) => set("coreContent", toggleIn(draft.coreContent, v))}
                        color="emerald"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Occasionally relevant (Secondary)</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={CASE_STATUS_OPTIONS}
                        selected={draft.secondaryContent ?? []}
                        onToggle={(v) => set("secondaryContent", toggleIn(draft.secondaryContent, v))}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">What does NOT belong here?</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      This matters as much as what belongs — it keeps recommendations from drifting.
                    </p>
                    <div className="mt-3">
                      <ChipGroup
                        options={CASE_STATUS_OPTIONS}
                        selected={draft.excludedContent ?? []}
                        onToggle={(v) => set("excludedContent", toggleIn(draft.excludedContent, v))}
                        color="rose"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">Where does this channel cover?</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={GEOGRAPHY_OPTIONS}
                        selected={draft.geographicFocus ?? []}
                        onToggle={(v) => set("geographicFocus", toggleIn(draft.geographicFocus, v))}
                        color="emerald"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Any locations to avoid?</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={GEOGRAPHY_OPTIONS}
                        selected={draft.excludedGeographies ?? []}
                        onToggle={(v) => set("excludedGeographies", toggleIn(draft.excludedGeographies, v))}
                        color="rose"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">How old/new should cases be?</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={CASE_AGE_OPTIONS}
                        selected={draft.caseAgePreference ?? []}
                        onToggle={(v) => set("caseAgePreference", toggleIn(draft.caseAgePreference, v))}
                        allowCustom={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">What's your storytelling lens?</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={EDITORIAL_LENS_OPTIONS}
                        selected={draft.editorialLens ?? []}
                        onToggle={(v) => set("editorialLens", toggleIn(draft.editorialLens, v))}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Describe your ideal episode</h3>
                    <textarea
                      value={draft.idealEpisodeDescription ?? ""}
                      onChange={(e) => set("idealEpisodeDescription", e.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">What makes this channel different?</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Think research, storytelling, case selection, analysis, tone, or perspective.
                    </p>
                    <textarea
                      value={draft.differentiator ?? ""}
                      onChange={(e) => set("differentiator", e.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      "Other channels cover the same cases. This one is different because ______."
                    </h3>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">Titles should prioritize</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={TITLE_PRIORITY_OPTIONS}
                        selected={draft.titlePriorities ?? []}
                        onToggle={(v) => set("titlePriorities", toggleIn(draft.titlePriorities, v))}
                        allowCustom={false}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Thumbnails should communicate</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={THUMBNAIL_PRIORITY_OPTIONS}
                        selected={draft.thumbnailPriorities ?? []}
                        onToggle={(v) => set("thumbnailPriorities", toggleIn(draft.thumbnailPriorities, v))}
                        allowCustom={false}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Primary goal for this channel</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={GOAL_OPTIONS}
                        selected={draft.primaryGoal ? [draft.primaryGoal] : []}
                        onToggle={(v) => set("primaryGoal", v)}
                        allowCustom={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">This channel should never...</h3>
                    <div className="mt-3">
                      <ChipGroup
                        options={BOUNDARY_OPTIONS}
                        selected={draft.editorialBoundaries ?? []}
                        onToggle={(v) => set("editorialBoundaries", toggleIn(draft.editorialBoundaries, v))}
                        color="rose"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      "When someone watches this channel, they should always leave feeling ______."
                    </h3>
                    <input
                      value={draft.channelPromise ?? ""}
                      onChange={(e) => set("channelPromise", e.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">"This channel exists to ______."</h3>
                    <input
                      value={draft.channelMission ?? ""}
                      onChange={(e) => set("channelMission", e.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 p-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:scale-[1.02] disabled:opacity-50"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:scale-[1.02] disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save & Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}