const spark = (base: number) =>
  Array.from({ length: 12 }, () => ({ v: base + Math.random() * base * 0.4 }));

export const PERFORMANCE_STATS = [
  { label: "Views", value: "1.24M", change: "28.6%", period: "vs Apr 22 – May 19", sparkline: spark(20), color: "#3B82F6" },
  { label: "Watch Time (Hours)", value: "98.7K", change: "32.4%", period: "vs Apr 22 – May 19", sparkline: spark(18), color: "#A855F7" },
  { label: "Subscribers Gained", value: "12.8K", change: "35.7%", period: "vs Apr 22 – May 19", sparkline: spark(15), color: "#10B981" },
  { label: "Avg. View Duration", value: "12:46", change: "18.9%", period: "vs Apr 22 – May 19", sparkline: spark(12), color: "#3B82F6" },
  { label: "Impressions", value: "3.65M", change: "27.1%", period: "vs Apr 22 – May 19", sparkline: spark(22), color: "#F59E0B" },
  { label: "CTR", value: "6.8%", change: "14.2%", period: "vs Apr 22 – May 19", sparkline: spark(10), color: "#06B6D4" },
];