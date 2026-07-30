"use client";

import { Zap, ChevronDown } from "lucide-react";

export function SettingsTopBarActions() {
  return (
    <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-600">
      <Zap className="h-3.5 w-3.5" /> Quick Actions <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}