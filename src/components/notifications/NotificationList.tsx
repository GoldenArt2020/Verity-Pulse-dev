"use client";

import { useState } from "react";
import { Target, TrendingUp, User, Users, AlertTriangle, Calendar, Settings, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { NOTIFICATIONS_TODAY, NOTIFICATIONS_YESTERDAY } from "@/constants/notifications";

const ICON_MAP = { target: Target, trendingUp: TrendingUp, user: User, users: Users, alertTriangle: AlertTriangle, calendar: Calendar, settings: Settings, fileText: FileText };

function NotificationItem({ n }: { n: (typeof NOTIFICATIONS_TODAY)[number] }) {
  const Icon = ICON_MAP[n.icon as keyof typeof ICON_MAP];
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 hover:bg-slate-800/40">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.color}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white">{n.title}</p>
          <p className="truncate text-[12px] text-slate-400">{n.desc}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${n.tagColor}`}>{n.tag}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {n.unread && <span className="h-2 w-2 rounded-full bg-blue-500" />}
        <span className="text-[11px] text-slate-500">{n.time}</span>
      </div>
    </div>
  );
}

export function NotificationList() {
  const [page, setPage] = useState(1);

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <p className="text-[12px] font-semibold text-slate-400">Today</p>
      <div className="mt-1 space-y-1">
        {NOTIFICATIONS_TODAY.map((n) => (
          <NotificationItem key={n.title} n={n} />
        ))}
      </div>

      <p className="mt-4 text-[12px] font-semibold text-slate-400">Yesterday</p>
      <div className="mt-1 space-y-1">
        {NOTIFICATIONS_YESTERDAY.map((n) => (
          <NotificationItem key={n.title} n={n} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4">
        <p className="text-[12px] text-slate-500">Showing 1 to 8 of 18 notifications</p>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800/50">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-7 w-7 rounded-lg text-[12px] font-medium ${page === p ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-800/50"}`}
            >
              {p}
            </button>
          ))}
          <button className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800/50">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-[12px] text-slate-300">10 per page</button>
      </div>
    </div>
  );
}