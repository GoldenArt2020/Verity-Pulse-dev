"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Tags as TagsIcon, Copy, Check, Save } from "lucide-react";

export function TagCreationPanel({ angleId }: { angleId: string }) {
  const [tagsText, setTagsText] = useState("");
  const [savedTagsText, setSavedTagsText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/angle/${angleId}/metadata`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          const joined = (data.tags ?? []).join(", ");
          setTagsText(joined);
          setSavedTagsText(data.tags ? joined : null);
        }
      })
      .catch(() => {
        if (active) setError("Failed to load saved tags");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [angleId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/angle/${angleId}/tags`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate tags");
      const joined = data.tags.join(", ");
      setTagsText(joined);
      setSavedTagsText(joined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tags");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/angle/${angleId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save tags");
      setSavedTagsText(tags.join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tags");
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(tagsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const tagList = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
  const isDirty = tagsText !== (savedTagsText ?? "");

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagsIcon className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Tag Creation</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {tagsText ? "Regenerate" : "Generate Tags"}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Only high-search-value tags — no generic filler. Grounded in real search data for this case.
      </p>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

      {!tagsText && !generating && (
        <p className="mt-4 text-xs text-slate-500">No tags generated yet — click Generate Tags to get started.</p>
      )}

      {generating && !tagsText && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Researching search data and generating tags...
        </div>
      )}

      {(tagsText || generating) && (
        <>
          <textarea
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            rows={3}
            placeholder="tag one, tag two, tag three..."
            className="mt-4 w-full resize-y rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 text-sm leading-relaxed text-slate-200 outline-none focus:border-blue-500/50"
          />

          {tagList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tagList.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/60"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save Edits"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}