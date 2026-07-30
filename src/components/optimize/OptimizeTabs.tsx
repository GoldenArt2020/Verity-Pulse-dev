"use client";

import { useState } from "react";
import { Type, Image as ImageIcon, AlignLeft, Tag, ListOrdered, UploadCloud, Gauge } from "lucide-react";

const TABS = [
  { label: "Title", icon: Type },
  { label: "Thumbnail", icon: ImageIcon },
  { label: "Description", icon: AlignLeft },
  { label: "Tags", icon: Tag },
  { label: "Chapters", icon: ListOrdered },
  { label: "Upload Settings", icon: UploadCloud },
  { label: "SEO Score", icon: Gauge },
];

export function OptimizeTabs() {
  const [active, setActive] = useState("Title");

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