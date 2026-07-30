"use client";

import { Globe2 } from "lucide-react";
import { VIDEO_DETAILS } from "@/constants/contentPlannerWorkflow";

export function VideoDetailsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-white">Video Details</h3>
        <button className="text-[11px] font-medium text-blue-400 hover:text-blue-300">Edit</button>
      </div>

      <div className="mt-3 space-y-2.5">
        <Row label="Working Title" value={VIDEO_DETAILS.workingTitle} />
        <Row label="Target Length" value={VIDEO_DETAILS.targetLength} />
        <Row
          label="Primary Angle"
          value={
            <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-400">
              {VIDEO_DETAILS.primaryAngle}
            </span>
          }
        />
        <Row label="Content Type" value={VIDEO_DETAILS.contentType} />
        <Row
          label="Visibility"
          value={
            <span className="flex items-center gap-1 text-slate-300">
              <Globe2 className="h-3 w-3" /> {VIDEO_DETAILS.visibility}
            </span>
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}