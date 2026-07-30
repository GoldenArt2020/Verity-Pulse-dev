export const NOTIFICATION_TABS = [
  { label: "All Notifications", count: 18 },
  { label: "Unread", count: 8 },
  { label: "Mentions", count: 3 },
  { label: "System", count: 4 },
  { label: "Alerts", count: 6 },
  { label: "Collaborations", count: 2 },
];

export const NOTIFICATIONS_TODAY = [
  { icon: "target", color: "bg-purple-500/10 text-purple-400", title: "High Opportunity Case Identified", desc: '"The Disappearance of Lana Purcell" has a 96% viral potential.', tag: "Opportunity", tagColor: "bg-purple-500/10 text-purple-400", time: "9:41 AM", unread: true },
  { icon: "trendingUp", color: "bg-emerald-500/10 text-emerald-400", title: "Performance Milestone", desc: 'Your channel "VerityPulse" reached 100K views in the last 7 days.', tag: "Performance", tagColor: "bg-emerald-500/10 text-emerald-400", time: "8:32 AM", unread: true },
  { icon: "user", color: "bg-blue-500/10 text-blue-400", title: "You were mentioned", desc: 'Sarah Khan mentioned you in a comment on "Natalie Hemming Investigation".', tag: "Mention", tagColor: "bg-blue-500/10 text-blue-400", time: "7:15 AM", unread: true },
  { icon: "users", color: "bg-amber-500/10 text-amber-400", title: "New Collaboration Invite", desc: 'Michael Turner invited you to collaborate on the project "UK Cold Cases".', tag: "Collaboration", tagColor: "bg-amber-500/10 text-amber-400", time: "6:02 AM", unread: false },
];

export const NOTIFICATIONS_YESTERDAY = [
  { icon: "alertTriangle", color: "bg-rose-500/10 text-rose-400", title: "Competitor Alert", desc: 'True Crime Central published a video on "Lana Purcell Case".', tag: "Competitor", tagColor: "bg-rose-500/10 text-rose-400", time: "Yesterday, 9:23 PM", unread: false },
  { icon: "calendar", color: "bg-purple-500/10 text-purple-400", title: "Content Scheduled", desc: 'Your video "The Curious Disappearance of Andrew Gosden" is scheduled.', tag: "Content", tagColor: "bg-purple-500/10 text-purple-400", time: "Yesterday, 6:45 PM", unread: false },
  { icon: "settings", color: "bg-emerald-500/10 text-emerald-400", title: "System Update", desc: "We've improved our AI model for opportunity scoring.", tag: "System", tagColor: "bg-emerald-500/10 text-emerald-400", time: "Yesterday, 2:14 PM", unread: false },
  { icon: "fileText", color: "bg-blue-500/10 text-blue-400", title: "Weekly Report Ready", desc: "Your weekly performance report is ready to view.", tag: "Report", tagColor: "bg-blue-500/10 text-blue-400", time: "Yesterday, 10:08 AM", unread: false },
];

export const NOTIFICATION_SUMMARY = [
  { label: "Total", value: 18, icon: "bell", color: "bg-purple-500/10 text-purple-400" },
  { label: "Unread", value: 8, icon: "mail", color: "bg-blue-500/10 text-blue-400" },
  { label: "Mentions", value: 3, icon: "at", color: "bg-emerald-500/10 text-emerald-400" },
  { label: "Alerts", value: 6, icon: "flag", color: "bg-amber-500/10 text-amber-400" },
];

export const SUMMARY_BREAKDOWN = [
  { label: "Opportunities", value: 5, pct: 28, color: "#A855F7" },
  { label: "Performance", value: 4, pct: 22, color: "#10B981" },
  { label: "System", value: 4, pct: 22, color: "#3B82F6" },
  { label: "Collaborations", value: 3, pct: 17, color: "#F59E0B" },
  { label: "Other", value: 2, pct: 11, color: "#64748B" },
];

export const UPCOMING_REMINDERS = [
  { icon: "calendar", title: "Project Deadline", desc: "UK Cold Cases - Phase 2", tag: "Tomorrow", time: "11:00 AM" },
  { icon: "calendar", title: "Content Publish", desc: "Natalie Hemming Documentary", tag: "May 27, 2026", time: "6:00 PM" },
  { icon: "users", title: "Team Meeting", desc: "Weekly Strategy Sync", tag: "May 28, 2026", time: "2:00 PM" },
];

export const NOTIFICATION_PREFERENCES = [
  { label: "Email Alerts", status: "Enabled", icon: "mail", color: "text-emerald-400" },
  { label: "Push Notifications", status: "Enabled", icon: "smartphone", color: "text-emerald-400" },
  { label: "In-App Alerts", status: "Enabled", icon: "bell", color: "text-emerald-400" },
  { label: "Digest Frequency", status: "Daily", icon: "clock", color: "text-slate-300" },
];

export const RECENT_ACTIVITY_HIGHLIGHTS = [
  { icon: "folder", title: "New case saved", desc: "The Disappearance of Lana Purcell", time: "10:11 AM" },
  { icon: "sparkles", title: "AI analysis complete", desc: "Natalie Hemming Investigation", time: "9:02 AM" },
  { icon: "messageCircle", title: "New comment", desc: "On Andrew Gosden Case", time: "Yesterday" },
  { icon: "trendingUp", title: "Rank improved", desc: "Lana Purcell Case moved to #3 on opportunities", time: "Yesterday" },
  { icon: "award", title: "Channel milestone", desc: "Reached 50K subscribers on VerityPulse", time: "May 24" },
  { icon: "link", title: "Integration update", desc: "YouTube API synced successfully", time: "May 24" },
];