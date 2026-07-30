const spark = (trend: "up" | "up-strong") =>
  Array.from({ length: 10 }, (_, i) => ({
    v: trend === "up-strong" ? 10 + i * i * 0.6 + Math.random() * 5 : 10 + i * 3 + Math.random() * 4,
  }));

const scoreStyle = (score: number) =>
  score >= 90
    ? "bg-emerald-500/90 text-white"
    : score >= 80
    ? "bg-emerald-500/80 text-white"
    : score >= 60
    ? "bg-amber-500/90 text-white"
    : "bg-rose-500/90 text-white";

const scoreLabel = (score: number) =>
  score >= 90 ? "Excellent" : score >= 80 ? "Very Good" : score >= 60 ? "Good" : "Fair";

export const OPPORTUNITIES = [
  {
    score: 92,
    scoreLabel: scoreLabel(92),
    scoreColor: scoreStyle(92),
    title: "The Disappearance of Lana Purcell",
    location: "London, UK",
    category: "Missing Person",
    date: "Jan 2011",
    description:
      "27-year-old mother vanished in North London. Police delayed action for months. Major institutional failure angles still underexplored.",
    tags: [
      { label: "Missing Person", color: "bg-blue-500/20 text-blue-400" },
      { label: "Institutional Failure", color: "bg-purple-500/20 text-purple-400" },
      { label: "Mother", color: "bg-amber-500/20 text-amber-400" },
      { label: "Unresolved", color: "bg-slate-700 text-slate-300" },
    ],
    moreTags: 2,
    trendPct: "312%",
    trendData: spark("up-strong"),
    coverage: "Low" as const,
    competitionScore: "18",
    competitionLabel: "Very Low",
  },
  {
    score: 88,
    scoreLabel: scoreLabel(88),
    scoreColor: scoreStyle(88),
    title: "The Vanishing of Andrew Gosden",
    location: "Doncaster, UK",
    category: "Missing Person",
    date: "Sep 2007",
    description:
      "14-year-old boy disappeared after leaving home. Limited new coverage in 15+ years despite ongoing public interest.",
    tags: [
      { label: "Missing Person", color: "bg-blue-500/20 text-blue-400" },
      { label: "Child", color: "bg-rose-500/20 text-rose-400" },
      { label: "Long-Term Mystery", color: "bg-purple-500/20 text-purple-400" },
    ],
    moreTags: 1,
    trendPct: "176%",
    trendData: spark("up"),
    coverage: "Low" as const,
    competitionScore: "22",
    competitionLabel: "Very Low",
  },
  {
    score: 85,
    scoreLabel: scoreLabel(85),
    scoreColor: scoreStyle(85),
    title: "The Natalie Hemming Case",
    location: "Milton Keynes, UK",
    category: "Court Case",
    date: "2010",
    description: "Wife murdered by husband. Strong court narrative with public interest resurging.",
    tags: [
      { label: "Court Case", color: "bg-amber-500/20 text-amber-400" },
      { label: "Domestic Violence", color: "bg-rose-500/20 text-rose-400" },
      { label: "Trial", color: "bg-slate-700 text-slate-300" },
      { label: "Resolved", color: "bg-emerald-500/20 text-emerald-400" },
    ],
    moreTags: 1,
    trendPct: "121%",
    trendData: spark("up"),
    coverage: "Low" as const,
    competitionScore: "27",
    competitionLabel: "Very Low",
  },
  {
    score: 78,
    scoreLabel: scoreLabel(78),
    scoreColor: scoreStyle(78),
    title: "The Soho House Murder Mystery",
    location: "London, UK",
    category: "Unsolved Murder",
    date: "2013",
    description: "High-profile unsolved murder with limited digital footprint and strong narrative potential.",
    tags: [
      { label: "Unsolved Murder", color: "bg-rose-500/20 text-rose-400" },
      { label: "London", color: "bg-blue-500/20 text-blue-400" },
      { label: "Mystery", color: "bg-purple-500/20 text-purple-400" },
    ],
    moreTags: 1,
    trendPct: "84%",
    trendData: spark("up"),
    coverage: "Medium" as const,
    competitionScore: "34",
    competitionLabel: "Low",
  },
];