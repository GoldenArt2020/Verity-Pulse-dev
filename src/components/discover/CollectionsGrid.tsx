"use client";

import { Users, Building2, Shield, Siren, Archive, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const COLLECTIONS = [
  { label: "Missing Persons", icon: Users, color: "text-purple-400 bg-purple-500/15" },
  { label: "Institutional Failures", icon: Building2, color: "text-amber-400 bg-amber-500/15" },
  { label: "Organized Crime", icon: Shield, color: "text-rose-400 bg-rose-500/15" },
  { label: "Police Corruption", icon: Siren, color: "text-blue-400 bg-blue-500/15" },
  { label: "Cold Cases", icon: Archive, color: "text-slate-400 bg-slate-500/15" },
  { label: "County Lines", icon: Landmark, color: "text-emerald-400 bg-emerald-500/15" },
];

export function CollectionsGrid() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#FAFAFA]">Browse Collections</h2>
      <p className="mt-1 text-xs text-[#71717A]">Explore by theme and category</p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {COLLECTIONS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.button
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 font-semibold text-[#FAFAFA]">{c.label}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}