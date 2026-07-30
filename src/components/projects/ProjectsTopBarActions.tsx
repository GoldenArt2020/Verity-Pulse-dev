"use client";

import { Calendar, Upload } from "lucide-react";

export function ProjectsTopBarActions() {
  return (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
        <Calendar className="h-3.5 w-3.5" /> May 20 – Jun 16, 2026
      </button>
      <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
        <Upload className="h-3.5 w-3.5" /> Export Report
      </button>
    </div>
  );
}