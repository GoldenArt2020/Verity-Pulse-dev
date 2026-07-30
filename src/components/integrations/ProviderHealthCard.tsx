"use client";

interface ProviderHealthCardProps {
  name: string;
  category: string;
  status: "connected" | "degraded" | "disconnected";
  detail: string;
}

const STATUS_STYLE = {
  connected: { dot: "bg-emerald-400", label: "Connected", color: "text-emerald-400" },
  degraded: { dot: "bg-amber-400", label: "Degraded", color: "text-amber-400" },
  disconnected: { dot: "bg-rose-400", label: "Disconnected", color: "text-rose-400" },
};

export function ProviderHealthCard({ name, category, status, detail }: ProviderHealthCardProps) {
  const s = STATUS_STYLE[status];

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-[11px] text-slate-500">{category}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${s.color}`}>
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}