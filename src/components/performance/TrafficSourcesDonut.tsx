"use client";

const TRAFFIC_SOURCES = [
  { label: "YouTube Search", value: 42, color: "#3B82F6" },
  { label: "Suggested Videos", value: 28, color: "#A855F7" },
  { label: "External", value: 16, color: "#10B981" },
  { label: "Browse Features", value: 9, color: "#F59E0B" },
  { label: "Other", value: 5, color: "#64748B" },
];

export function TrafficSourcesDonut() {
  const circumference = 2 * Math.PI * 42;
  let acc = 0;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-[14px] font-semibold text-white">Traffic Sources</h3>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
            {TRAFFIC_SOURCES.map((s) => {
              const dash = (s.value / 100) * circumference;
              const offset = -((acc / 100) * circumference);
              acc += s.value;
              return (
                <circle
                  key={s.label}
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">100%</span>
            <span className="text-[9.5px] text-slate-500">Total</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {TRAFFIC_SOURCES.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
              <span className="text-slate-500">{s.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}