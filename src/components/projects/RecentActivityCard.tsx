"use client";

import { Folder, Users } from "lucide-react";
import { RECENT_ACTIVITY } from "@/constants/projects";

const ICONS = { folder: Folder, users: Users };

export function RecentActivityCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Recent Activity</h3>
        <button className="text-[11px] font-medium text-brand hover:opacity-80">View All</button>
      </div>

      <div className="mt-3 space-y-3">
        {RECENT_ACTIVITY.map((activity, idx) => {
          const Icon = ICONS[activity.icon as keyof typeof ICONS];
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className={`h-3.5 w-3.5 ${activity.color}`} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-snug text-foreground/90">{activity.title}</p>
                {activity.sub && (
                  <p className="text-[11px] text-muted-foreground">{activity.sub}</p>
                )}
                <p className="mt-0.5 text-[10.5px] text-muted-foreground/70">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}