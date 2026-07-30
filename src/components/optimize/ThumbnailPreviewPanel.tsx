"use client";

const ANALYSIS = [
  { label: "Face detected", value: "Yes", color: "text-emerald-400" },
  { label: "Emotional intensity", value: "High", color: "text-emerald-400" },
  { label: "Text clarity", value: "Excellent", color: "text-emerald-400" },
  { label: "Contrast", value: "Excellent", color: "text-emerald-400" },
  { label: "Clickability score", value: "89/100", color: "text-white" },
];

export function ThumbnailPreviewPanel() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">6</span>
          <h3 className="text-sm font-semibold text-white">Thumbnail Preview</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Score</span>
          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">89</span>
        </div>
      </div>

      <div className="mt-3 aspect-video rounded-xl bg-slate-800" />

      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
          Change Thumbnail
        </button>
        <button className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
          Analyze Another
        </button>
      </div>

      <div className="mt-4 border-t border-slate-800/60 pt-4">
        <p className="text-xs font-medium text-slate-400">Thumbnail Analysis</p>
        <div className="mt-2 space-y-1.5">
          {ANALYSIS.map((a) => (
            <div key={a.label} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{a.label}</span>
              <span className={`font-medium ${a.color}`}>{a.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}