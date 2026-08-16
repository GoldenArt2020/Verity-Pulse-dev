"use client";

import { useState } from "react";
import { Globe, Check, Loader2 } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";

const REGION_OPTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Ireland",
];

export function ChannelRegionSetting() {
  const { channels, activeChannelRowId, refresh } = useChannelId();
  const activeChannel = channels.find((c) => c.id === activeChannelRowId);

  const [selected, setSelected] = useState<string>(activeChannel?.baseRegion ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeChannel) return null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/channel/${activeChannel!.id}/region`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseRegion: selected || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update region");
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update region");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = selected !== (activeChannel.baseRegion ?? "");

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Channel Base Region</h3>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        Recommendations for <span className="text-slate-300">{activeChannel.channelName}</span> are locked to this
        region — cases from anywhere else are never suggested. Set this once for reliable results, or leave it
        unset to let VerityPulse infer it from your video history instead.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-slate-800/60 bg-slate-950/60 px-3.5 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none"
        >
          <option value="">Let VerityPulse detect it from my videos</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}