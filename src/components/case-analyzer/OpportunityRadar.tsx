"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const DATA = [
  { metric: "Search Demand", value: 95 },
  { metric: "Low Competition", value: 92 },
  { metric: "Audience Interest", value: 90 },
  { metric: "Narrative Gaps", value: 88 },
  { metric: "Timeliness", value: 70 },
  { metric: "Monetization Potential", value: 85 },
];

export function OpportunityRadar() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={DATA} outerRadius="75%">
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}