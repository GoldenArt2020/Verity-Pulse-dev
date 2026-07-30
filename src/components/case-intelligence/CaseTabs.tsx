"use client";

import { useState } from "react";
import { LayoutGrid, Radar, ListChecks, FileText, Users, MapPin, Image as ImageIcon, StickyNote } from "lucide-react";

const TABS = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Intelligence", icon: Radar },
  { label: "Timeline", icon: ListChecks },
  { label: "Documents", icon: FileText },
  { label: "People", icon: Users },
  { label: "Locations", icon: MapPin },
  { label: "Media", icon: ImageIcon },
  { label: "Notes", icon: StickyNote },
];

export function CaseTabs() {
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