"use client";

import { CheckCircle2, Database, ScanSearch, Video, Timer } from "lucide-react";

export function AnalysisProgressBar() {
  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
        <div>
          <p className="text-[11px] text-slate-500">Analysis Progress</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-slate-800">
              <div className="h-1.5 w-full rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs font-medium text-white">100% Complete</span>
          </div>
        </div>
      </div>

      <StatusItem icon={Database} label="Data Points Analyzed" value="1,248" />
      <StatusItem icon={ScanSearch} label="Sources Scanned" value="217" />
      <StatusItem icon={Video} label="Similar Videos Analyzed" value="1,248" />
      <StatusItem icon={Timer} label="Analysis Time" value="2m 14s" />
    </div>
  );
}

function StatusItem({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}