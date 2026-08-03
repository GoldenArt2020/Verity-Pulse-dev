"use client";

import { useRouter } from "next/navigation";
import { Users, Building2, ShieldAlert, Siren, Archive } from "lucide-react";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";

const COLLECTIONS = [
  { label: "Missing Persons", icon: Users, color: "text-purple-400", bg: "bg-purple-500/15" },
  { label: "Institutional Failures", icon: Building2, color: "text-amber-400", bg: "bg-amber-500/15" },
  { label: "Organized Crime", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/15" },
  { label: "Police Corruption", icon: Siren, color: "text-blue-400", bg: "bg-blue-500/15" },
  { label: "Cold Cases", icon: Archive, color: "text-emerald-400", bg: "bg-emerald-500/15" },
];

export function CollectionsGrid() {
  const router = useRouter();
  const { counts } = useCategoryCounts();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {COLLECTIONS.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.label}
            onClick={() => router.push(`/discover/collection/${encodeURIComponent(c.label)}`)}
            className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#FAFAFA]">{c.label}</p>
            <p className="text-xs text-[#71717A]">{counts[c.label] ?? 0} cases</p>
          </button>
        );
      })}
    </div>
  );
}