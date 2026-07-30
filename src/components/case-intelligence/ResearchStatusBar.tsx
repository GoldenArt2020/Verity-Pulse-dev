"use client";

import { CheckCircle2, Clock, ScanSearch, Gauge, Timer } from "lucide-react";

export function ResearchStatusBar() {
  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <StatusItem icon={CheckCircle2} iconColor="text-emerald-400" label="Research Status" value="Complete" />
      <StatusItem icon={Clock} iconColor="text-slate-400" label="Last Updated" value="2h ago" />
      <StatusItem icon={ScanSearch} iconColor="text-slate-400" label="Sources Scanned" value="473" />
      <StatusItem icon={Gauge} iconColor="text-blue-400" label="Confidence Level" value="↑ High" />
      <StatusItem icon={Timer} iconColor="text-slate-400" label="Research Time" value="4m 32s" />
    </div>
  );
}

function StatusItem({ icon: Icon, iconColor, label, value }: { icon: typeof Clock; iconColor: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.75} />
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}