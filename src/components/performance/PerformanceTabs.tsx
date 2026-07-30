"use client";

import { useState } from "react";
import { LayoutGrid, FileText, Radio, Users, DollarSign, Repeat, Activity, ListVideo } from "lucide-react";

const TABS = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Content", icon: FileText },
  { label: "Traffic Sources", icon: Radio },
  { label: "Audience", icon: Users },
  { label: "Revenue", icon: DollarSign },
  { label: "Retention", icon: Repeat },
  { label: "Engagement", icon: Activity },
  { label: "Playlists", icon: ListVideo },
];

export function PerformanceTabs() {
  const [active, setActive] = useState("Overview");

  return (
    <div className="flex gap-6 border-b border-slate-800/60">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.label;
        return (
          <button
            key={t.label}
            onClick={() => setActive(t.label)}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              isActive ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}