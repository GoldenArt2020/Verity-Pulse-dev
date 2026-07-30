"use client";

import { Target, Crown, Search, BarChart3, Star } from "lucide-react";
import { ACHIEVEMENTS } from "@/constants/userProfile";

const ICON_MAP = { target: Target, crown: Crown, search: Search, barChart: BarChart3, star: Star };

export function AchievementsCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Achievements</h3>
        <button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View All</button>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
          return (
            <div key={a.id} className="flex flex-col items-center text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${a.color}`}
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="mt-2 text-[11.5px] font-medium leading-tight text-slate-200">{a.label}</p>
              <p className="mt-1 text-[10px] text-slate-500">Unlocked</p>
              <p className="text-[10px] text-slate-500">{a.unlocked}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}