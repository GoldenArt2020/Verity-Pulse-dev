"use client";

import { motion } from "framer-motion";
import { Briefcase, Play, Waves, Moon, Sun } from "lucide-react";
import { NetworkBackground } from "@/components/homepage/NetworkBackground";
import { StatItem } from "@/components/homepage/StatItem";
import { Logo } from "@/components/homepage/Logo";
import { LoginCard } from "@/components/homepage/LoginCard";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-[rgb(2,6,23)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.12),transparent_55%)]" />

      <div className="absolute right-8 top-8 z-20 flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 p-1.5 backdrop-blur">
        <button className="rounded-full p-1.5 text-slate-500 hover:text-slate-300" aria-label="Dark mode">
          <Moon className="h-4 w-4" />
        </button>
        <button className="rounded-full bg-blue-500 p-1.5 text-white" aria-label="Light mode">
          <Sun className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-10 hidden w-1/2 flex-col justify-center px-20 lg:flex">
        <NetworkBackground />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Logo className="h-20 w-20" />
          <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight text-white">
            VERITYPULSE
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            The Intelligence Platform for True Crime Creators
          </p>

          <div className="mt-14 grid grid-cols-3 gap-10">
            <StatItem icon={Briefcase} value={12481} label="Cases Indexed" delay={0.1} />
            <StatItem icon={Play} value={214000} label="Videos Analyzed" delay={0.2} />
            <StatItem icon={Waves} value={1800000} suffix="" label="Intelligence Signals" delay={0.3} />
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-0 text-xs text-slate-600">
          Version 1.0 · © VerityPulse
        </div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center px-6 lg:w-1/2">
        <LoginCard />
      </div>
    </main>
  );
}