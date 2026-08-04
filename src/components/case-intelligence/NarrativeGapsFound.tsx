"use client";

interface Angle {
  lens: string;
  title: string;
  hook: string;
  rationale: string;
  keyBeats: string[];
}

const LENS_LABELS: Record<string, string> = {
  "victim-centered": "Victim-Centered",
  investigative: "Investigative Deep-Dive",
  "systemic-failure": "Systemic / Institutional Failure",
  "family-impact": "Family & Community Impact",
  courtroom: "Legal / Courtroom Drama",
};

export function NarrativeGapsFound({
  angles,
  loading,
}: {
  angles: Angle[] | null;
  loading: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Narrative Gaps Found</h3>
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/30" />
          ))}
        </div>
      )}

      {!loading && (!angles || angles.length === 0) && (
        <p className="mt-3 text-xs text-slate-500">
          Click &quot;Find Uncovered Angles&quot; above to analyze this case against existing YouTube coverage.
        </p>
      )}

      {!loading && angles && angles.length > 0 && (
        <div className="mt-3 space-y-2">
          {angles.map((angle, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800/60 p-3 hover:border-blue-500/30"
            >
              <span className="inline-block rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                {LENS_LABELS[angle.lens] ?? angle.lens}
              </span>
              <p className="mt-1.5 text-[13px] font-medium text-white">{angle.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
                {angle.rationale}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}