"use client";

import { Repeat2, ThumbsUp, MessageSquare, Share2, MousePointerClick } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const spark = (base: number) =>
  Array.from({ length: 10 }, () => ({ v: base + Math.random() * base * 0.5 }));

const ITEMS = [
  { icon: Repeat2, label: "Audience Retention (Average)", value: "46.3%", change: "8.7% vs previous period", color: "#3B82F6" },
  { icon: ThumbsUp, label: "Likes", value: "38.6K", change: "29.4%", color: "#10B981" },
  { icon: MessageSquare, label: "Comments", value: "5.2K", change: "40.1%", color: "#F59E0B" },
  { icon: Share2, label: "Shares", value: "8.7K", change: "33.2%", color: "#A855F7" },
  { icon: MousePointerClick, label: "End Screen Clicks", value: "12.4K", change: "25.8%", color: "#06B6D4" },
];

export function EngagementStrip() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{item.label}</p>
              <Icon className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
            <p className="text-[11px] font-medium text-emerald-400">↑ {item.change}</p>
            <div className="mt-1 h-6 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark(20)}>
                  <Line type="monotone" dataKey="v" stroke={item.color} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}