import { Target, Star, FileText, Play, Eye, Percent } from "lucide-react";

const spark = (base: number) =>
  Array.from({ length: 12 }, () => ({ v: base + Math.random() * base * 0.4 }));

export const STATS = [
  { icon: Target, iconColor: "bg-blue-500/15 text-blue-400", label: "Total Opportunities", value: "248", change: "24%", period: "7 days", sparkline: spark(20) },
  { icon: Star, iconColor: "bg-emerald-500/15 text-emerald-400", label: "High Opportunity Cases", value: "36", change: "41%", period: "7 days", sparkline: spark(15) },
  { icon: FileText, iconColor: "bg-blue-500/15 text-blue-400", label: "Research Completed", value: "127", change: "18%", period: "7 days", sparkline: spark(18) },
  { icon: Play, iconColor: "bg-amber-500/15 text-amber-400", label: "Videos Published", value: "23", change: "15%", period: "7 days", sparkline: spark(10) },
  { icon: Eye, iconColor: "bg-blue-500/15 text-blue-400", label: "Total Views (30D)", value: "1.24M", change: "32%", period: "vs last 30 days", sparkline: spark(25) },
  { icon: Percent, iconColor: "bg-emerald-500/15 text-emerald-400", label: "Avg. CTR (30D)", value: "7.6%", change: "12%", period: "vs last 30 days", sparkline: spark(12) },
];