"use client";

const TITLES = [
  { title: "THE CASE POLICE IGNORED: The Disappearance of Lana Purcell | UK True Crime", score: 94 },
  { title: "Lana Purcell: Police Neglect or Something Much Darker? | True Crime Documentary", score: 92 },
  { title: "The Disappearance of Lana Purcell: A Case of Institutional Failure | UK True Crime", score: 90 },
  { title: "Ignored, Forgotten, Missing: The Lana Purcell Case | True Crime Documentary", score: 88 },
  { title: "20,000 Reasons She's Still Missing: The Lana Purcell Story | UK True Crime", score: 86 },
];

export function TitleIdeasList() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Title Ideas (Top 5)</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {TITLES.map((t, i) => (
          <div key={t.title} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
            <span className="mt-0.5 shrink-0 text-xs font-semibold text-slate-500">{i + 1}</span>
            <p className="min-w-0 flex-1 text-[12px] leading-snug text-slate-300">{t.title}</p>
            <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              {t.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}