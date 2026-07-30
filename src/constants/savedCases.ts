export interface SavedCase {
  id: string;
  name: string;
  subtitle: string;
  categories: string[];
  location: string;
  opportunityScore: number;
  tier: "High" | "Medium" | "Low";
  status: "Shortlisted" | "Researching" | "On Hold" | "Archived";
  savedOn: string;
  savedTime: string;
  image?: string;
}

export const SAVED_CASES_STATS = [
  { key: "total", label: "Total Saved", value: 58, sub: "Cases & opportunities", icon: "bookmark", color: "text-blue-400 bg-blue-500/15" },
  { key: "researching", label: "Researching", value: 18, sub: "In progress", icon: "search", color: "text-purple-400 bg-purple-500/15" },
  { key: "highPotential", label: "High Potential", value: 14, sub: "High opportunity score", icon: "trending", color: "text-emerald-400 bg-emerald-500/15" },
  { key: "shortlisted", label: "Shortlisted", value: 9, sub: "Ready for production", icon: "star", color: "text-purple-400 bg-purple-500/15" },
  { key: "onHold", label: "On Hold", value: 6, sub: "Waiting / on hold", icon: "pause", color: "text-amber-400 bg-amber-500/15" },
  { key: "archive", label: "Archive", value: 11, sub: "Completed / archived", icon: "archive", color: "text-slate-400 bg-slate-500/15" },
];

export const SAVED_CASES: SavedCase[] = [
  { id: "1", name: "The Disappearance of Lana Purcell", subtitle: "Missing Person", categories: ["Missing Person", "Unsolved"], location: "London, UK", opportunityScore: 92, tier: "High", status: "Shortlisted", savedOn: "May 16, 2026", savedTime: "9:14 AM" },
  { id: "2", name: "Natalie Hemming: The Evidence They Missed", subtitle: "Murder Investigation", categories: ["Murder", "Investigation"], location: "Milton Keynes, UK", opportunityScore: 88, tier: "High", status: "Researching", savedOn: "May 15, 2026", savedTime: "3:32 PM" },
  { id: "3", name: "Andrew Gosden Disappearance", subtitle: "Missing Person", categories: ["Missing Person", "Unsolved"], location: "London, UK", opportunityScore: 84, tier: "High", status: "Shortlisted", savedOn: "May 14, 2026", savedTime: "11:07 AM" },
  { id: "4", name: "The Moors Murders: The Untold Leads", subtitle: "Cold Case", categories: ["Murder", "Cold Case"], location: "Manchester, UK", opportunityScore: 81, tier: "High", status: "Researching", savedOn: "May 13, 2026", savedTime: "6:45 PM" },
  { id: "5", name: "The Michael Gaine Case", subtitle: "Murder Investigation", categories: ["Murder", "Unsolved"], location: "Birmingham, UK", opportunityScore: 76, tier: "Medium", status: "On Hold", savedOn: "May 12, 2026", savedTime: "8:21 AM" },
  { id: "6", name: "Georgina Gharsallah Case", subtitle: "Murder Investigation", categories: ["Murder", "Unsolved"], location: "Leicester, UK", opportunityScore: 74, tier: "Medium", status: "Researching", savedOn: "May 11, 2026", savedTime: "2:10 PM" },
  { id: "7", name: "Katie Simpson CCTV Case", subtitle: "Missing Person", categories: ["Missing Person", "Investigation"], location: "Cleveland, UK", opportunityScore: 71, tier: "Medium", status: "Researching", savedOn: "May 10, 2026", savedTime: "10:02 AM" },
  { id: "8", name: "The Ann Widdecombe Investigation", subtitle: "Murder Investigation", categories: ["Murder", "Historical"], location: "Devon, UK", opportunityScore: 68, tier: "Medium", status: "On Hold", savedOn: "May 9, 2026", savedTime: "9:55 AM" },
];

export const CATEGORY_TAG_COLOR: Record<string, string> = {
  "Missing Person": "bg-blue-500/15 text-blue-400",
  "Unsolved": "bg-slate-500/20 text-slate-300",
  "Murder": "bg-rose-500/15 text-rose-400",
  "Investigation": "bg-blue-500/15 text-blue-400",
  "Cold Case": "bg-cyan-500/15 text-cyan-400",
  "Historical": "bg-purple-500/15 text-purple-400",
};

export const STATUS_COLOR: Record<string, string> = {
  Shortlisted: "bg-purple-500/15 text-purple-400",
  Researching: "bg-blue-500/15 text-blue-400",
  "On Hold": "bg-amber-500/15 text-amber-400",
  Archived: "bg-slate-500/15 text-slate-400",
};

export const TOP_CATEGORY_BREAKDOWN = [
  { label: "Missing Person", pct: 45, count: 26, color: "bg-blue-500" },
  { label: "Murder Investigation", pct: 31, count: 18, color: "bg-rose-500" },
  { label: "Cold Case", pct: 14, count: 8, color: "bg-cyan-500" },
  { label: "Other", pct: 10, count: 6, color: "bg-slate-500" },
];

export const SAVED_CASES_OVERVIEW_DONUT = [
  { label: "High (80-100)", value: 14, pct: 24, color: "#10B981" },
  { label: "Medium (50-79)", value: 28, pct: 48, color: "#F59E0B" },
  { label: "Low (0-49)", value: 16, pct: 28, color: "#7C3AED" },
];

export const YOUR_TAGS = [
  { label: "Missing Person", count: 18, color: "bg-blue-500/15 text-blue-400" },
  { label: "Murder", count: 15, color: "bg-rose-500/15 text-rose-400" },
  { label: "Unsolved", count: 12, color: "bg-slate-500/20 text-slate-300" },
  { label: "Investigation", count: 11, color: "bg-blue-500/15 text-blue-400" },
  { label: "Cold Case", count: 8, color: "bg-cyan-500/15 text-cyan-400" },
  { label: "Historical", count: 6, color: "bg-purple-500/15 text-purple-400" },
  { label: "CCTV", count: 5, color: "bg-slate-500/20 text-slate-300" },
  { label: "UK", count: 24, color: "bg-slate-500/20 text-slate-300" },
];

export const AI_RECOMMENDATIONS = [
  { icon: "sparkles", color: "bg-purple-500/15 text-purple-400", title: "3 saved cases have new developments", sub: "Review the latest updates" },
  { icon: "trending", color: "bg-emerald-500/15 text-emerald-400", title: "2 cases are trending in your area", sub: "Higher interest detected" },
  { icon: "zap", color: "bg-blue-500/15 text-blue-400", title: "1 case has weak competition", sub: "High opportunity to rank" },
];