"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Video, FileText, CircleAlert, X } from "lucide-react";

interface VideoSource {
  id: string;
  youtube_video_id: string;
  youtube_url: string;
  video_title: string;
  channel_name: string;
  publication_date: string | null;
  source_category: string;
  relevance_score: number;
  transcript_status: "not_attempted" | "available" | "unavailable" | "processing";
}

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "News",
  DOCUMENTARY: "Documentary",
  INTERVIEW: "Interview",
  COURT: "Court",
  POLICE: "Police",
  PRESS_CONFERENCE: "Press Conference",
  ANALYSIS: "Analysis",
  COMMENTARY: "Commentary",
  PODCAST: "Podcast",
  ARCHIVE: "Archive",
  OTHER: "Other",
};

function TranscriptBadge({ status }: { status: VideoSource["transcript_status"] }) {
  if (status === "available") {
    return (
      <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        Transcript available
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="rounded-full bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-400">
        Processing…
      </span>
    );
  }
  if (status === "unavailable") {
    return (
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        Transcript unavailable
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
      Not yet fetched
    </span>
  );
}

function TranscriptModal({
  sourceId,
  caseId,
  title,
  onClose,
}: {
  sourceId: string;
  caseId: string;
  title: string;
  onClose: () => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/case/${caseId}/video-sources/${sourceId}/transcript`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load transcript");
        setText(data.cleaned_transcript);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load transcript"))
      .finally(() => setLoading(false));
  }, [caseId, sourceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading transcript…
            </div>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {text && <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{text}</p>}
        </div>
      </div>
    </div>
  );
}

export function VideoSourcesSection({ caseId, caseName }: { caseId: string; caseName: string }) {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [fetchingTranscripts, setFetchingTranscripts] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingSourceId, setViewingSourceId] = useState<string | null>(null);

  async function loadSources() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/case/${caseId}/video-sources`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load video sources");
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video sources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function handleDiscover() {
    setDiscovering(true);
    setError(null);
    try {
      const res = await fetch(`/api/case/${caseId}/video-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discovery failed");
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleFetchTranscripts() {
    setFetchingTranscripts(true);
    setError(null);
    try {
      // Loop the bounded batch endpoint until nothing's left pending,
      // so this works for any number of sources without holding one
      // long request open — matches the progress-bar UX from the spec.
      let remaining = 1;
      while (remaining > 0) {
        const res = await fetch(`/api/case/${caseId}/video-sources/transcripts`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Transcript fetch failed");
        remaining = data.remaining ?? 0;
        setTranscriptProgress(remaining > 0 ? `${remaining} remaining…` : "Finishing up…");
        await loadSources();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcript fetch failed");
    } finally {
      setFetchingTranscripts(false);
      setTranscriptProgress(null);
    }
  }

  const notAttemptedCount = sources.filter((s) => s.transcript_status === "not_attempted").length;
  const viewingSource = sources.find((s) => s.id === viewingSourceId) ?? null;

  return (
    <div className="mt-5 border-t border-slate-800/60 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Video className="h-3.5 w-3.5" /> Video Sources {sources.length > 0 && `(${sources.length})`}
        </h4>
        <div className="flex gap-2">
          {notAttemptedCount > 0 && (
            <button
              onClick={handleFetchTranscripts}
              disabled={fetchingTranscripts}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
            >
              {fetchingTranscripts ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
              {fetchingTranscripts ? transcriptProgress ?? "Fetching…" : `Fetch Transcripts (${notAttemptedCount})`}
            </button>
          )}
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800/50 disabled:opacity-60"
          >
            {discovering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            {discovering ? "Searching YouTube…" : sources.length > 0 ? "Search again" : "Discover Sources"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-400">
          <CircleAlert className="h-3 w-3" /> {error}
        </p>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading sources…
        </div>
      )}

      {!loading && sources.length === 0 && !error && (
        <p className="mt-3 text-[11px] text-slate-500">
          No video sources discovered yet. Click "Discover Sources" to search YouTube for relevant coverage of this
          case.
        </p>
      )}

      {!loading && sources.length > 0 && (
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={s.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium text-slate-200 hover:text-blue-400"
                >
                  {s.video_title}
                </a>
                <span className="shrink-0 rounded-full bg-blue-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                  {s.relevance_score}%
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                <span>{s.channel_name}</span>
                {s.publication_date && <span>· {new Date(s.publication_date).toLocaleDateString()}</span>}
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                  {CATEGORY_LABELS[s.source_category] ?? s.source_category}
                </span>
                <TranscriptBadge status={s.transcript_status} />
              </div>
              {s.transcript_status === "available" && (
                <button
                  onClick={() => setViewingSourceId(s.id)}
                  className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
                >
                  <FileText className="h-3 w-3" /> View Transcript
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {viewingSource && (
        <TranscriptModal
          sourceId={viewingSource.id}
          caseId={caseId}
          title={viewingSource.video_title}
          onClose={() => setViewingSourceId(null)}
        />
      )}
    </div>
  );
}