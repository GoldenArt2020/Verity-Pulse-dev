"use client";

import { useState } from "react";
import { User, SlidersHorizontal, Bell, Lock, CreditCard, Plug, Settings as SettingsIcon, GitBranch } from "lucide-react";
import { SETTINGS_TABS } from "@/constants/settings";

const ICON_MAP = {
  user: User,
  sliders: SlidersHorizontal,
  bell: Bell,
  lock: Lock,
  creditCard: CreditCard,
  plug: Plug,
  settings: SettingsIcon,
  gitBranch: GitBranch,
};

export function SettingsTabsBar() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex items-center gap-1 border-b border-slate-800/60 px-1">
      {SETTINGS_TABS.map((tab, idx) => {
        const Icon = ICON_MAP[tab.icon as keyof typeof ICON_MAP];
        const isActive = idx === active;
        return (
          <button
            key={tab.label}
            onClick={() => setActive(idx)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
              isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}