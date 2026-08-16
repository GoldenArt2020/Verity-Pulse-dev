"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Type, Copy, Check } from "lucide-react";

interface TitleSuggestion {
  title: string;
  formula: string;
}

export function TitleSuggestionsPanel({ angleId }: { angleId: string }) {
  const [titles, setTitles] = useState<TitleSuggestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/angle/${angleId}/metadata`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setTitles(data.suggestedTitles ?? null);
      })
      .catch(() => {
        if (active) setError("Failed to load saved titles");
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
      const res = await fetch(`/api/angle/${angleId}/titles`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate titles");
      setTitles(data.titles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate titles");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(title: string, index: number) {
    navigator.clipboard.writeText(title).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    });
  }

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
          <Type className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Title Suggestions</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {titles ? "Regenerate" : "Generate Titles"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

      {!titles && !generating && (
        <p className="mt-4 text-xs text-slate-500">
          No titles generated yet — click Generate Titles to get 8 options across different proven formulas.
        </p>
      )}

      {generating && !titles && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating title options...
        </div>
      )}

      {titles && (
        <div className="mt-4 space-y-2">
          {titles.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{t.title}</p>
                <span className="mt-0.5 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                  {t.formula}
                </span>
              </div>
              <button
                onClick={() => handleCopy(t.title, i)}
                className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                title="Copy title"
              >
                {copiedIndex === i ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}