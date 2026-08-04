// src/components/case-intelligence/ResearchStatusBar.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ScanSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ResearchStatusBar({ caseId }: { caseId: string }) {
  const [sourcesCount, setSourcesCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    Promise.all([
      supabase.from("sources").select("*", { count: "exact", head: true }).eq("case_id", caseId),
      supabase.from("cases").select("last_updated").eq("id", caseId).single(),
    ]).then(([{ count }, { data }]) => {
      if (!active) return;
      setSourcesCount(count ?? 0);
      setLastUpdated(data?.last_updated ?? null);
    });

    return () => {
      active = false;
    };
  }, [caseId]);

  return (
    <div className="glass-card flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/40 px-6 py-4">
      <StatusItem icon={CheckCircle2} iconColor="text-emerald-400" label="Research Status" value="Complete" />
      <StatusItem
        icon={Clock}
        iconColor="text-slate-400"
        label="Last Updated"
        value={lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "—"}
      />
      <StatusItem
        icon={ScanSearch}
        iconColor="text-slate-400"
        label="Sources Scanned"
        value={sourcesCount != null ? String(sourcesCount) : "—"}
      />
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