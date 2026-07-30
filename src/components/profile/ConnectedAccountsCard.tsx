"use client";

import type { SVGProps } from "react";
import { HardDrive, FileText } from "lucide-react";
import { CONNECTED_ACCOUNTS } from "@/constants/userProfile";

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function SlackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 15a2 2 0 1 1-2-2h2v2Z" />
      <path d="M7 15a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5Z" />
      <path d="M9 6a2 2 0 1 1 2-2v2H9Z" />
      <path d="M9 7a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4h5Z" />
      <path d="M18 9a2 2 0 1 1 2 2h-2V9Z" />
      <path d="M17 9a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0v5Z" />
      <path d="M15 18a2 2 0 1 1-2 2v-2h2Z" />
      <path d="M15 17a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5Z" />
    </svg>
  );
}

const ICON_MAP = { youtube: YoutubeIcon, googleDrive: HardDrive, slack: SlackIcon, notion: FileText };

export function ConnectedAccountsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Connected Accounts</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">Manage</button>
      </div>

      <div className="mt-3 space-y-1">
        {CONNECTED_ACCOUNTS.map((acc) => {
          const Icon = ICON_MAP[acc.icon as keyof typeof ICON_MAP];
          return (
            <div key={acc.name} className="flex items-center justify-between gap-3 rounded-xl px-1 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${acc.color}`}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-slate-200">{acc.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{acc.handle}</p>
                </div>
              </div>
              <span className="shrink-0 text-[10.5px] text-slate-500">{acc.connected}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}