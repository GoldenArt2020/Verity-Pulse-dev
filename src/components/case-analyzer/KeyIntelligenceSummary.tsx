"use client";

import { TrendingUp, Flame, Eye, Users2 } from "lucide-react";
import type { SVGProps } from "react";

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

const ITEMS = [
  { icon: TrendingUp, color: "bg-blue-500/15 text-blue-400", title: "Rising Search Interest", desc: "Searches for this case have increased 312% in the last 30 days." },
  { icon: Flame, color: "bg-amber-500/15 text-amber-400", title: "Media Mention Spike", desc: "News and forums saw a spike after the 2020 reward announcement." },
  { icon: Eye, color: "bg-purple-500/15 text-purple-400", title: "Uncovered Angles", desc: "We found 3 major narrative gaps competitors haven't covered." },
  { icon: YoutubeIcon, color: "bg-rose-500/15 text-rose-400", title: "Low YouTube Saturation", desc: "Only 12 in-depth videos. Most are low quality or outdated." },
  { icon: Users2, color: "bg-emerald-500/15 text-emerald-400", title: "Audience Alignment", desc: "Matches your channel audience interest by 94%." },
];

export function KeyIntelligenceSummary() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <h3 className="text-base font-semibold text-white">Key Intelligence Summary</h3>

      <div className="mt-3 space-y-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/40">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}