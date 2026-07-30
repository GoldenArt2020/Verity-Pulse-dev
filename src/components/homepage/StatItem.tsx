"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { LucideIcon } from "lucide-react";

interface StatItemProps {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}

export function StatItem({ icon: Icon, value, suffix = "", label, delay = 0 }: StatItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const start = performance.now();

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [isInView, value]);

  const formatted =
    value >= 1_000_000
      ? (display / 1_000_000).toFixed(1) + "M"
      : display.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-2"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
        <Icon className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
      </div>
      <span className="font-mono-vp text-2xl font-semibold tracking-tight text-white">
        {formatted}
        {suffix}
      </span>
      <span className="text-sm text-slate-400">{label}</span>
    </motion.div>
  );
}