"use client";

import { Play, Eye, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import { useChannelId } from "@/hooks/useChannelId";
import { useChannelStats } from "@/hooks/useChannelStats";

const fakeSpark = Array.from({ length: 12 }, () => ({ v: 10 + Math.random() * 8 }));

export function ChannelStatCards() {
  const { channelId } = useChannelId();
  const { stats, loading, error } = useChannelStats(channelId);

  if (!channelId) {
    return (
      <div className="col-span-3 flex items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-4 text-xs text-slate-500">
        Connect a YouTube channel in Channel Intelligence to see live stats.
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-3 flex items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-xs text-slate-400">
        Couldn't load channel stats.
      </div>
    );
  }

  return (
    <>
      <StatCard
        icon={Play}
        iconColor="bg-amber-500/15 text-amber-400"
        label="Videos Published"
        value={loading ? "—" : String(stats?.videoCount ?? 0)}
        change="—"
        period="live"
        sparkline={fakeSpark}
        loading={loading}
      />
      <StatCard
        icon={Eye}
        iconColor="bg-blue-500/15 text-blue-400"
        label="Total Views"
        value={loading ? "—" : (stats?.viewCount ?? 0).toLocaleString()}
        change="—"
        period="live"
        sparkline={fakeSpark}
        loading={loading}
      />
      <StatCard
        icon={Users}
        iconColor="bg-emerald-500/15 text-emerald-400"
        label="Subscribers"
        value={loading ? "—" : (stats?.subscriberCount ?? 0).toLocaleString()}
        change="—"
        period="live"
        sparkline={fakeSpark}
        loading={loading}
      />
    </>
  );
}