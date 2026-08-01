"use client";

import { FileText, Download } from "lucide-react";

const DOCS = [
  { name: "Met Police Missing Person Report", type: "PDF", size: "1.2 MB", date: "Jan 18, 2011" },
  { name: "Family Appeal Letter", type: "PDF", size: "856 KB", date: "Oct 05, 2012" },
  { name: "Police Search Warrant Summary", type: "PDF", size: "1.4 MB", date: "Mar 15, 2016" },
  { name: "Reward Announcement Press Release", type: "DOCX", size: "321 KB", date: "Sep 23, 2020" },
  { name: "Operation Kagal Case Update", type: "PDF", size: "641 KB", date: "Feb 03, 2021" },
];

const TYPE_COLOR: Record<string, string> = {
  PDF: "bg-rose-500/20 text-rose-400",
  DOCX: "bg-blue-500/20 text-blue-400",
};

export function KeyDocuments({ caseId }: { caseId?: string }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Key Documents</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {DOCS.map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-medium text-white">{d.name}</p>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLOR[d.type]}`}>
                  {d.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{d.size} · {d.date}</p>
            </div>
            <button className="shrink-0 text-slate-500 hover:text-blue-400" aria-label="Download">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}