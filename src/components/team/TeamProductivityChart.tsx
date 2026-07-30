"use client";

const WEEKS = ["May 4", "May 11", "May 18", "May 25", "Jun 1"];
const THIS_MONTH = [45, 58, 62, 55, 70, 68, 75, 72, 80, 78];
const LAST_MONTH = [40, 48, 50, 52, 58, 60, 62, 65, 66, 68];

function buildPath(values: number[], width: number, height: number) {
  const max = 100;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - (v / max) * height}`)
    .join(" ");
}

export function TeamProductivityChart() {
  const width = 240;
  const height = 90;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const score = 78;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Team Productivity</h3>
          <p className="text-[10.5px] text-slate-500">This Month vs Last Month</p>
        </div>
        <div className="flex items-center gap-3 text-[10.5px]">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-1.5 w-3 rounded-full bg-blue-500" /> This Month
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="h-1.5 w-3 rounded-full border border-slate-500 border-dashed" /> Last Month
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-24 flex-1">
          <path d={buildPath(LAST_MONTH, width, height)} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d={buildPath(THIS_MONTH, width, height)} fill="none" stroke="#3B82F6" strokeWidth="2" />
        </svg>

        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-lg font-bold text-white">{score}%</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex justify-between text-[9.5px] text-slate-600">
        {WEEKS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] font-medium text-emerald-400">↑ 12% vs last month</p>

      <button className="mt-2 w-full text-center text-[12px] font-medium text-blue-400 hover:text-blue-300">
        View Productivity Report →
      </button>
    </div>
  );
}