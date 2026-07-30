"use client";

const TIER_COLOR: Record<string, string> = {
  High: "#10B981",
  Medium: "#F59E0B",
  Low: "#7C3AED",
};

export function OpportunityScoreArc({ value, tier }: { value: number; tier: "High" | "Medium" | "Low" }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={TIER_COLOR[tier]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[13px] font-bold text-white">{value}</span>
      </div>
    </div>
  );
}