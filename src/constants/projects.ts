export interface Project {
  id: string;
  name: string;
  subtitle: string;
  subtitleColor: string;
  cases: number;
  progress: number;
  status: "Active" | "On Hold" | "Completed" | "Archived";
  owner: string;
  teamAvatars: number;
  extraMembers?: number;
  updated: string;
  updatedTime: string;
}

export const PROJECT_STATS = [
  { key: "total", label: "Total Projects", value: "23", delta: "21.1% vs last 30 days", deltaUp: true, icon: "folder", color: "text-blue-400 bg-blue-500/15" },
  { key: "active", label: "Active Projects", value: "9", delta: "12.5% vs last 30 days", deltaUp: true, icon: "play", color: "text-emerald-400 bg-emerald-500/15" },
  { key: "completed", label: "Completed", value: "7", delta: "40% vs last 30 days", deltaUp: true, icon: "checkCircle", color: "text-emerald-400 bg-emerald-500/15" },
  { key: "onHold", label: "On Hold", value: "4", delta: "20% vs last 30 days", deltaUp: false, icon: "pauseCircle", color: "text-amber-400 bg-amber-500/15" },
  { key: "avgCompletion", label: "Avg. Completion", value: "65%", delta: "8% vs last 30 days", deltaUp: true, icon: "gauge", color: "text-cyan-400 bg-cyan-500/15" },
  { key: "totalCases", label: "Total Cases", value: "142", delta: "18.3% vs last 30 days", deltaUp: true, icon: "briefcase", color: "text-purple-400 bg-purple-500/15" },
];

export const PROJECT_TABS = [
  { label: "All Projects", count: 23 },
  { label: "Active", count: 9 },
  { label: "On Hold", count: 4 },
  { label: "Completed", count: 7 },
  { label: "Archived", count: 3 },
];

export const PROJECTS: Project[] = [
  { id: "1", name: "The Disappearance of Lana Purcell", subtitle: "Missing Person Series", subtitleColor: "bg-blue-500/15 text-blue-400", cases: 8, progress: 85, status: "Active", owner: "David O.", teamAvatars: 3, extraMembers: 2, updated: "May 16, 2026", updatedTime: "9:14 AM" },
  { id: "2", name: "Natalie Hemming Investigation", subtitle: "Murder Investigation", subtitleColor: "bg-rose-500/15 text-rose-400", cases: 12, progress: 75, status: "Active", owner: "Sarah K.", teamAvatars: 3, extraMembers: 3, updated: "May 15, 2026", updatedTime: "3:32 PM" },
  { id: "3", name: "Andrew Gosden Case Files", subtitle: "Missing Person Series", subtitleColor: "bg-blue-500/15 text-blue-400", cases: 10, progress: 60, status: "Active", owner: "Michael T.", teamAvatars: 3, extraMembers: 1, updated: "May 14, 2026", updatedTime: "11:07 AM" },
  { id: "4", name: "The Moors Murders: The Untold Leads", subtitle: "Cold Case Analysis", subtitleColor: "bg-cyan-500/15 text-cyan-400", cases: 15, progress: 40, status: "On Hold", owner: "Emily R.", teamAvatars: 3, extraMembers: 2, updated: "May 13, 2026", updatedTime: "6:45 PM" },
  { id: "5", name: "The Michael Gaine Case Review", subtitle: "Murder Investigation", subtitleColor: "bg-rose-500/15 text-rose-400", cases: 9, progress: 35, status: "On Hold", owner: "James L.", teamAvatars: 3, extraMembers: 1, updated: "May 12, 2026", updatedTime: "8:21 AM" },
  { id: "6", name: "Georgina Gharsallah Case", subtitle: "Murder Investigation", subtitleColor: "bg-rose-500/15 text-rose-400", cases: 7, progress: 90, status: "Completed", owner: "Sarah K.", teamAvatars: 2, updated: "May 10, 2026", updatedTime: "2:10 PM" },
  { id: "7", name: "Katie Simpson CCTV Case", subtitle: "Missing Person Series", subtitleColor: "bg-blue-500/15 text-blue-400", cases: 6, progress: 100, status: "Completed", owner: "David O.", teamAvatars: 3, extraMembers: 2, updated: "May 9, 2026", updatedTime: "10:02 AM" },
  { id: "8", name: "Ann Widdecombe Investigation", subtitle: "Murder Investigation", subtitleColor: "bg-rose-500/15 text-rose-400", cases: 11, progress: 100, status: "Completed", owner: "Michael T.", teamAvatars: 2, updated: "May 7, 2026", updatedTime: "4:18 PM" },
];

export const STATUS_BADGE_COLOR: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-400",
  "On Hold": "bg-amber-500/15 text-amber-400",
  Completed: "bg-blue-500/15 text-blue-400",
  Archived: "bg-slate-500/15 text-slate-400",
};

export const PROGRESS_BAR_COLOR: Record<string, string> = {
  Active: "bg-emerald-500",
  "On Hold": "bg-amber-500",
  Completed: "bg-blue-500",
  Archived: "bg-slate-500",
};

export const PROJECTS_OVERVIEW_DONUT = [
  { label: "Active", value: 9, pct: 39, color: "#10B981" },
  { label: "On Hold", value: 4, pct: 17, color: "#F59E0B" },
  { label: "Completed", value: 7, pct: 30, color: "#3B82F6" },
  { label: "Archived", value: 3, pct: 13, color: "#7C3AED" },
];

export const PROGRESS_OVERVIEW_BARS = [
  { label: "Active", pct: 75, color: "bg-emerald-500" },
  { label: "On Hold", pct: 38, color: "bg-amber-500" },
  { label: "Completed", pct: 100, color: "bg-blue-500" },
  { label: "Archived", pct: 22, color: "bg-purple-500" },
];

export const AI_PROJECT_INSIGHTS = [
  { icon: "alertTriangle", color: "bg-rose-500/15 text-rose-400", title: "2 projects are behind schedule", sub: "Review and reassign resources" },
  { icon: "sparkles", color: "bg-emerald-500/15 text-emerald-400", title: "3 projects have high opportunity", sub: "Focus on content production" },
  { icon: "alertTriangle", color: "bg-rose-500/15 text-rose-400", title: "1 project at risk", sub: "Requires immediate attention" },
];

export const RECENT_ACTIVITY = [
  { icon: "folder", color: "text-blue-400", title: 'Case "New CCTV Footage" added', sub: "The Disappearance of Lana Purcell", time: "9:14 AM" },
  { icon: "folder", color: "text-blue-400", title: 'Project "Michael Gaine Case Review" updated', sub: "", time: "8:32 PM" },
  { icon: "users", color: "text-purple-400", title: "Team member added to project", sub: "Andrew Gosden Case Files", time: "Yesterday" },
];