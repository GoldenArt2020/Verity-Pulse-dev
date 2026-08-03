"use client";

import { useRouter } from "next/navigation";
import { Users, Building2, ShieldAlert, Siren, Archive, FolderOpen } from "lucide-react";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";

const ICONS: Record<string, { icon: typeof Users; color: string; bg: string }> = {
  "Missing Person": { icon: Users, color: "text-purple-400", bg: "bg-purple-500/15" },
  "Missing Persons": { icon: Users, color: "text-purple-400", bg: "bg-purple-500/15" },
  "Institutional Failures": { icon: Building2, color: "text-amber-400", bg: "bg-amber-500/15" },
  "Organized Crime": { icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/15" },
  "Murder Investigation": { icon: Siren, color: "text-blue-400", bg: "bg-blue-500/15" },
  "Police Corruption": { icon: Siren, color: "text-blue-400", bg: "bg-blue-500/15" },
  "Cold Cases": { icon: Archive, color: "text-emerald-400", bg: "bg-emerald-500/15" },
};
const DEFAULT_ICON = { icon: FolderOpen, color: "text-slate-400", bg: "bg-slate-500/15" };

export function CollectionsGrid() {
  const router = useRouter();
  const { categories, loading } = useCategoryCounts();

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 w-[240px] shrink-0 animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114]"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-8 text-center">
        <p className="text-sm text-[#A1A1AA]">No categorized cases yet.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => {
        const { icon: Icon, color, bg } = ICONS[c.label] ?? DEFAULT_ICON;
        return (
          <button
            key={c.label}
            onClick={() => router.push(`/discover/collection/${encodeURIComponent(c.label)}`)}
            className="w-[240px] shrink-0 rounded-[18px] border border-white/[0.06] bg-[#111114] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#FAFAFA]">{c.label}</p>
            <p className="text-xs text-[#71717A]">{c.count} case{c.count === 1 ? "" : "s"}</p>
          </button>
        );
      })}
    </div>
  );
}