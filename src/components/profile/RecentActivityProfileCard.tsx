"use client";

import { FolderPlus, Bookmark, Sparkles, Download, FileEdit } from "lucide-react";
import { RECENT_ACTIVITY_PROFILE } from "@/constants/userProfile";

const ICON_MAP = { folderPlus: FolderPlus, bookmark: Bookmark, sparkles: Sparkles, download: Download, fileEdit: FileEdit };

export function RecentActivityProfileCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Recent Activity</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-3 space-y-1">
        {RECENT_ACTIVITY_PROFILE.map((activity, idx) => {
          const Icon = ICON_MAP[activity.icon as keyof typeof ICON_MAP];
          return (
            <div key={idx} className="flex items-start justify-between gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.color}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{activity.title}</p>
                  <p className="truncate text-[11px] text-slate-500">{activity.sub}</p>
                </div>
              </div>
              <span className="shrink-0 text-[10.5px] text-slate-500">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}