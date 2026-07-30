"use client";

import { Search, Target, TrendingUp, Users, FileText, Lightbulb, ChevronDown } from "lucide-react";
import { QUICK_ACTIONS } from "@/constants/aiAssistant";

const ICON_MAP = { search: Search, target: Target, trendingUp: TrendingUp, users: Users, fileText: FileText, lightbulb: Lightbulb };

export function GreetingCard() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Hello, David! 👋</h2>
          <p className="mt-1 text-sm text-slate-300">How can I help you uncover the truth and create impact today?</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <p className="text-[10px] text-slate-500">AI Model</p>
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> VerityPulse GPT-4o
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left">
            <div>
              <p className="text-[10px] text-slate-500">Context</p>
              <p className="text-[12.5px] font-medium text-slate-200">All Workspaces</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {QUICK_ACTIONS.map((a) => {
          const Icon = ICON_MAP[a.icon as keyof typeof ICON_MAP];
          return (
            <button
              key={a.title}
              className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 text-left transition hover:border-blue-500/40 hover:bg-slate-800/50"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="mt-2.5 text-[13px] font-semibold text-white">{a.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{a.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}