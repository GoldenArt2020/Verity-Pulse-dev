"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const DATA = [
  { emotion: "Curiosity", value: 95 },
  { emotion: "Anger", value: 78 },
  { emotion: "Surprise", value: 92 },
  { emotion: "Sadness", value: 88 },
  { emotion: "Fear", value: 78 },
];

export function EmotionalImpactRadar() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">4</span>
        <h3 className="text-sm font-semibold text-white">Emotional Impact</h3>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={DATA} outerRadius="70%">
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="emotion" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Radar dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}