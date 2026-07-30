export interface WorkflowTask {
  id: string;
  label: string;
  date: string;
  status: "done" | "in_progress" | "pending";
}

export interface WorkflowStage {
  id: string;
  title: string;
  icon: "check" | "analysis" | "script" | "production" | "publish";
  dateRange: string;
  percent: number;
  accent: string; // tailwind color token
  tasks: WorkflowTask[];
}

export const CASE_HEADER = {
  name: "The Disappearance of Lana Purcell",
  tag: "Missing Person",
  location: "London, UK",
  date: "Jan 2011",
  age: "27 years old",
  description:
    "Lana Purcell vanished in North London while walking to a nearby shop. Despite multiple appeals and a £20,000 reward, she has never been found.",
  image: "",
};

export const OPPORTUNITY_STATS = {
  opportunityScore: { value: 92, label: "Excellent", sub: "Top 8% of all opportunities" },
  searchTrend: { value: "312%", direction: "up", sub: "Strong upward trend" },
  youtubeCoverage: { level: "Low", score: "2.1 /10", sub: "Top 15% lowest" },
  competitionScore: { value: 18, max: 100, level: "Very Low" },
};

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "research",
    title: "Research",
    icon: "check",
    dateRange: "Jan 20 – Jan 22",
    percent: 100,
    accent: "emerald",
    tasks: [
      { id: "r1", label: "Case Dossier Review", date: "Jan 20", status: "done" },
      { id: "r2", label: "Documents & Reports", date: "Jan 20", status: "done" },
      { id: "r3", label: "News & Articles", date: "Jan 21", status: "done" },
      { id: "r4", label: "Timeline & Events", date: "Jan 21", status: "done" },
      { id: "r5", label: "People & Locations", date: "Jan 22", status: "done" },
    ],
  },
  {
    id: "analysis",
    title: "Analysis",
    icon: "analysis",
    dateRange: "Jan 23 – Jan 25",
    percent: 100,
    accent: "blue",
    tasks: [
      { id: "a1", label: "Narrative Gap Analysis", date: "Jan 23", status: "done" },
      { id: "a2", label: "Angle Development", date: "Jan 23", status: "done" },
      { id: "a3", label: "Competitor Breakdown", date: "Jan 24", status: "done" },
      { id: "a4", label: "Audience Intelligence", date: "Jan 24", status: "done" },
      { id: "a5", label: "Keyword Research", date: "Jan 25", status: "done" },
    ],
  },
  {
    id: "script",
    title: "Script & Structure",
    icon: "script",
    dateRange: "Jan 26 – Jan 29",
    percent: 75,
    accent: "purple",
    tasks: [
      { id: "s1", label: "Outline Creation", date: "Jan 26", status: "done" },
      { id: "s2", label: "Script Draft", date: "Jan 27", status: "done" },
      { id: "s3", label: "Script Review", date: "Jan 28", status: "in_progress" },
      { id: "s4", label: "Fact Check", date: "Jan 28", status: "in_progress" },
      { id: "s5", label: "Final Script", date: "Jan 29", status: "pending" },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: "production",
    dateRange: "Jan 30 – Feb 01",
    percent: 25,
    accent: "amber",
    tasks: [
      { id: "p1", label: "Voiceover Recording", date: "Jan 30", status: "pending" },
      { id: "p2", label: "B-Roll & Media", date: "Jan 30", status: "pending" },
      { id: "p3", label: "Video Editing", date: "Jan 31", status: "pending" },
      { id: "p4", label: "Sound Design", date: "Feb 01", status: "pending" },
      { id: "p5", label: "Internal Review", date: "Feb 01", status: "pending" },
    ],
  },
  {
    id: "publish",
    title: "Publish",
    icon: "publish",
    dateRange: "Feb 02 – Feb 03",
    percent: 0,
    accent: "rose",
    tasks: [
      { id: "pu1", label: "Thumbnail Design", date: "Feb 02", status: "pending" },
      { id: "pu2", label: "SEO Optimization", date: "Feb 02", status: "pending" },
      { id: "pu3", label: "Upload & Schedule", date: "Feb 02", status: "pending" },
      { id: "pu4", label: "Social Promotion", date: "Feb 03", status: "pending" },
      { id: "pu5", label: "Performance Tracking", date: "Feb 03", status: "pending" },
    ],
  },
];

export const PROGRESS_SUMMARY = {
  overallProgress: 64,
  status: "On Track",
  statusNote: "32 of 50 tasks completed",
  estimatedDuration: "14 Days",
  durationRange: "Jan 20 – Feb 03, 2026",
  tasksCompleted: "32 / 50",
  pendingTasks: "18 pending tasks",
  teamMembers: 3,
  activeNow: "2 active now",
  lastUpdated: "2 hours ago",
  lastUpdatedBy: "by David Okafor",
};

export const PUBLISHING_SCHEDULE = {
  plannedDate: "February 3, 2026",
  day: "Tuesday",
  time: "8:00 PM",
};

export const PRE_PUBLISH_CHECKLIST = [
  { id: "c1", label: "Final script approved", done: true },
  { id: "c2", label: "Voiceover recorded", done: true },
  { id: "c3", label: "B-roll footage added", done: true },
  { id: "c4", label: "Video editing complete", done: true },
  { id: "c5", label: "Thumbnail designed", done: false, inProgress: true },
  { id: "c6", label: "SEO metadata optimized", done: false, inProgress: true },
  { id: "c7", label: "End screens configured", done: false, inProgress: true },
  { id: "c8", label: "Cards added", done: false },
  { id: "c9", label: "Social posts prepared", done: false },
];

export const VIDEO_DETAILS = {
  workingTitle: "The Disappearance of Lana Purcell",
  targetLength: "18 – 22 minutes",
  primaryAngle: "Institutional Failure",
  contentType: "True Crime Documentary",
  visibility: "Public",
};

export const WORKFLOW_TABS = [
  "Overview",
  "Workflow",
  "Script",
  "Assets",
  "Team",
  "Schedule",
  "Analytics",
] as const;