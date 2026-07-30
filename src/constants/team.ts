export interface TeamMember {
  id: string;
  name: string;
  isYou?: boolean;
  email: string;
  role: string;
  roleColor: string;
  team: string;
  projects: number;
  tasksCompleted: number;
  tasksTotal: number;
  workload: number;
  workloadColor: string;
  status: "Online" | "Away" | "Offline";
  lastActive: string;
}

export const TEAM_STATS = [
  { key: "totalMembers", label: "Total Members", value: "18", sub: "2 new this month", subUp: true, icon: "users", color: "text-purple-400 bg-purple-500/15" },
  { key: "activeNow", label: "Active Now", value: "7", sub: "Currently online", icon: "radio", color: "text-emerald-400 bg-emerald-500/15", dot: true },
  { key: "projectsAssigned", label: "Projects Assigned", value: "23", sub: "Across the team", icon: "calendar", color: "text-blue-400 bg-blue-500/15" },
  { key: "tasksInProgress", label: "Tasks In Progress", value: "47", sub: "Across all projects", icon: "shuffle", color: "text-rose-400 bg-rose-500/15" },
  { key: "avgProductivity", label: "Avg. Productivity", value: "78%", sub: "12% vs last month", subUp: true, icon: "trendingUp", color: "text-emerald-400 bg-emerald-500/15" },
  { key: "invitationsPending", label: "Invitations Pending", value: "2", sub: "Awaiting acceptance", icon: "mailOpen", color: "text-amber-400 bg-amber-500/15" },
];

export const TEAM_TABS = ["Team Members", "Roles & Permissions", "Teams", "Activity", "Workload", "Collaborations"];

export const ROLE_COLOR: Record<string, string> = {
  Owner: "bg-purple-500/15 text-purple-400",
  Editor: "bg-blue-500/15 text-blue-400",
  Investigator: "bg-emerald-500/15 text-emerald-400",
  Writer: "bg-amber-500/15 text-amber-400",
  Analyst: "bg-cyan-500/15 text-cyan-400",
  Researcher: "bg-pink-500/15 text-pink-400",
};

export const WORKLOAD_COLOR = (pct: number) => {
  if (pct >= 80) return "bg-rose-500";
  if (pct >= 60) return "bg-amber-500";
  if (pct >= 40) return "bg-purple-500";
  return "bg-emerald-500";
};

export const STATUS_DOT_COLOR: Record<string, string> = {
  Online: "bg-emerald-500",
  Away: "bg-amber-500",
  Offline: "bg-slate-600",
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "David Okafor", isYou: true, email: "david@verritypulse.com", role: "Owner", roleColor: ROLE_COLOR.Owner, team: "Leadership", projects: 8, tasksCompleted: 12, tasksTotal: 18, workload: 72, workloadColor: WORKLOAD_COLOR(72), status: "Online", lastActive: "Now" },
  { id: "2", name: "Sarah Khan", email: "sarah@verritypulse.com", role: "Editor", roleColor: ROLE_COLOR.Editor, team: "Research", projects: 6, tasksCompleted: 8, tasksTotal: 14, workload: 58, workloadColor: WORKLOAD_COLOR(58), status: "Online", lastActive: "2m ago" },
  { id: "3", name: "Michael Turner", email: "michael@verritypulse.com", role: "Investigator", roleColor: ROLE_COLOR.Investigator, team: "Investigations", projects: 7, tasksCompleted: 15, tasksTotal: 20, workload: 85, workloadColor: WORKLOAD_COLOR(85), status: "Away", lastActive: "5m ago" },
  { id: "4", name: "Emily Roberts", email: "emily@verritypulse.com", role: "Writer", roleColor: ROLE_COLOR.Writer, team: "Content", projects: 5, tasksCompleted: 10, tasksTotal: 16, workload: 63, workloadColor: WORKLOAD_COLOR(63), status: "Online", lastActive: "1m ago" },
  { id: "5", name: "James Walker", email: "james@verritypulse.com", role: "Analyst", roleColor: ROLE_COLOR.Analyst, team: "Analytics", projects: 4, tasksCompleted: 6, tasksTotal: 12, workload: 50, workloadColor: WORKLOAD_COLOR(50), status: "Offline", lastActive: "1h ago" },
  { id: "6", name: "Lisa Chen", email: "lisa@verritypulse.com", role: "Researcher", roleColor: ROLE_COLOR.Researcher, team: "Research", projects: 4, tasksCompleted: 7, tasksTotal: 13, workload: 54, workloadColor: WORKLOAD_COLOR(54), status: "Online", lastActive: "3m ago" },
  { id: "7", name: "Daniel Brooks", email: "daniel@verritypulse.com", role: "Editor", roleColor: ROLE_COLOR.Editor, team: "Content", projects: 3, tasksCompleted: 5, tasksTotal: 10, workload: 45, workloadColor: WORKLOAD_COLOR(45), status: "Offline", lastActive: "2h ago" },
  { id: "8", name: "Priya Sharma", email: "priya@verritypulse.com", role: "Investigator", roleColor: ROLE_COLOR.Investigator, team: "Investigations", projects: 6, tasksCompleted: 11, tasksTotal: 16, workload: 69, workloadColor: WORKLOAD_COLOR(69), status: "Online", lastActive: "4m ago" },
];

export const TEAM_ACTIVITY_FEED = [
  { icon: "fileText", color: "text-blue-400", name: "Sarah Khan", action: "updated case notes", sub: "The Disappearance of Lana Purcell", time: "9:14 AM" },
  { icon: "shield", color: "text-emerald-400", name: "Michael Turner", action: "added new evidence", sub: "Natalie Hemming Investigation", time: "8:47 AM" },
  { icon: "penTool", color: "text-purple-400", name: "Emily Roberts", action: "completed script draft", sub: "Georgina Gharsallah Case", time: "7:32 AM" },
  { icon: "sparkles", color: "text-amber-400", name: "James Walker", action: "generated new angle", sub: "The Michael Gaine Case", time: "6:15 AM" },
  { icon: "fileSearch", color: "text-cyan-400", name: "Lisa Chen", action: "created research report", sub: "Andrew Gosden Disappearance", time: "Yesterday" },
  { icon: "image", color: "text-rose-400", name: "Daniel Brooks", action: "uploaded new thumbnail", sub: "Katie Simpson CCTV Case", time: "Yesterday" },
];

export const WORKLOAD_DISTRIBUTION = [
  { label: "Investigations", pct: 34, color: "#3B82F6" },
  { label: "Research", pct: 23, color: "#7C3AED" },
  { label: "Content", pct: 21, color: "#EC4899" },
  { label: "Editing", pct: 12, color: "#F59E0B" },
  { label: "Planning", pct: 10, color: "#10B981" },
];

export const TOP_PERFORMERS = [
  { rank: 1, name: "Sarah Khan", score: 92 },
  { rank: 2, name: "Michael Turner", score: 87 },
  { rank: 3, name: "Emily Roberts", score: 84 },
  { rank: 4, name: "Lisa Chen", score: 79 },
  { rank: 5, name: "Priya Sharma", score: 76 },
];

export const AI_TEAM_INSIGHTS = [
  { icon: "trendingUp", color: "bg-emerald-500/15 text-emerald-400", title: "Your team is most productive between", highlight: "9 AM – 1 PM" },
  { icon: "scale", color: "bg-purple-500/15 text-purple-400", title: "Consider redistributing 8 tasks", highlight: "to balance workload" },
  { icon: "users", color: "bg-blue-500/15 text-blue-400", title: "Research team could use 2 more", highlight: "investigators for current load" },
  { icon: "trendingUp", color: "bg-amber-500/15 text-amber-400", title: "Content output has increased 18%", highlight: "this month" },
];