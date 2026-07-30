export const SETTINGS_TABS = [
  { label: "Account", icon: "user" },
  { label: "Preferences", icon: "sliders" },
  { label: "Notifications", icon: "bell" },
  { label: "Security", icon: "lock" },
  { label: "Billing", icon: "creditCard" },
  { label: "Integrations", icon: "plug" },
  { label: "System", icon: "settings" },
  { label: "Advanced", icon: "gitBranch" },
];

export const PROFILE_SETTINGS = {
  fullName: "David Okafor",
  email: "david@verritypulse.com",
  emailVerified: true,
  role: "Creator",
  timezone: "(GMT+1) London, United Kingdom",
  language: "English",
};

export const PLATFORM_PREFERENCES = [
  { icon: "layoutDashboard", label: "Default Landing Page", sub: "Choose your default dashboard view", type: "select", value: "Mission Control" },
  { icon: "calendar", label: "Date Format", sub: "Select your preferred date format", type: "select", value: "May 20, 2026" },
  { icon: "clock", label: "Time Format", sub: "Select time display format", type: "select", value: "12 Hour (AM/PM)" },
  { icon: "coins", label: "Currency", sub: "Choose your preferred currency", type: "select", value: "GBP (£)" },
  { icon: "listOrdered", label: "Items Per Page", sub: "Set default items per page", type: "select", value: "20" },
  { icon: "palette", label: "Theme", sub: "Customize the appearance", type: "radio", value: "Dark" },
];

export const SECURITY_SETTINGS = [
  { icon: "key", label: "Password", sub: "Last changed on May 10, 2026", action: "Change" },
  { icon: "shieldCheck", label: "Two-Factor Authentication", sub: "Add an extra layer of security", status: "Enabled" },
  { icon: "monitor", label: "Active Sessions", sub: "Manage your active sessions", status: "4 Active" },
  { icon: "bellRing", label: "Login Alerts", sub: "Get notified of new logins", status: "Enabled" },
  { icon: "code", label: "API Access", sub: "Manage API keys and access", action: "Manage" },
  { icon: "smartphone", label: "Device Management", sub: "Manage trusted devices", action: "Manage" },
];

export interface NotificationRow {
  icon: string;
  color: string;
  label: string;
  sub: string;
  email: boolean;
  inApp: boolean;
  sms: boolean;
}

export const NOTIFICATION_PREFERENCES: NotificationRow[] = [
  { icon: "sparkles", color: "text-rose-400 bg-rose-500/15", label: "New Opportunities", sub: "Get notified about new high opportunity cases", email: true, inApp: true, sms: false },
  { icon: "key", color: "text-blue-400 bg-blue-500/15", label: "Keyword Alerts", sub: "Alerts for keyword ranking changes", email: true, inApp: true, sms: false },
  { icon: "folder", color: "text-purple-400 bg-purple-500/15", label: "Case Updates", sub: "Updates on cases you are following", email: true, inApp: true, sms: false },
  { icon: "alertTriangle", color: "text-amber-400 bg-amber-500/15", label: "System Alerts", sub: "Important system and security alerts", email: true, inApp: true, sms: true },
  { icon: "barChart", color: "text-emerald-400 bg-emerald-500/15", label: "Weekly Reports", sub: "Weekly performance and insights reports", email: true, inApp: false, sms: false },
];

export const DATA_PRIVACY = [
  { icon: "download", label: "Export Your Data", sub: "Download a copy of your data", action: "Export" },
  { icon: "shield", label: "Privacy Settings", sub: "Manage your privacy preferences", action: "Manage" },
  { icon: "database", label: "Data Retention", sub: "Choose how long to keep your data", action: "Configure" },
  { icon: "trash", label: "Clear Cache", sub: "Free up space and improve performance", action: "Clear" },
];

export const SYSTEM_PREFERENCES = [
  { icon: "save", label: "Auto Save", sub: "Automatically save your work", enabled: true },
  { icon: "moon", label: "Dark Mode", sub: "Use dark theme across the platform", enabled: true },
  { icon: "wand", label: "Animations", sub: "Enable interface animations", enabled: true },
  { icon: "volume", label: "Sound Effects", sub: "Play sounds for notifications", enabled: false },
  { icon: "flaskConical", label: "Beta Features", sub: "Access new features early", enabled: true },
];

export const STORAGE_USAGE = {
  used: "12.4 GB",
  total: "100 GB",
  pct: 12,
  breakdown: [
    { label: "Case Files", size: "4.2 GB", color: "bg-blue-500" },
    { label: "Media Assets", size: "3.8 GB", color: "bg-purple-500" },
    { label: "Documents", size: "2.1 GB", color: "bg-emerald-500" },
    { label: "Reports & Exports", size: "1.4 GB", color: "bg-amber-500" },
    { label: "Other", size: "0.9 GB", color: "bg-slate-500" },
  ],
};

export const ACCOUNT_HEALTH = {
  score: 96,
  label: "Excellent",
  checks: [
    { label: "Profile Complete", done: true },
    { label: "Email Verified", done: true },
    { label: "2FA Enabled", done: true },
    { label: "Active Plan", done: true },
  ],
};

export const RECENT_ACCOUNT_ACTIVITY = [
  { icon: "shieldCheck", color: "text-emerald-400 bg-emerald-500/15", title: "Password changed", sub: "May 19, 2026 9:14 AM" },
  { icon: "logIn", color: "text-blue-400 bg-blue-500/15", title: "New login from", sub: "London, UK", extra: "May 18, 2026 7:32 PM" },
  { icon: "key", color: "text-purple-400 bg-purple-500/15", title: "API key generated", sub: "May 17, 2026 3:21 PM" },
  { icon: "download", color: "text-emerald-400 bg-emerald-500/15", title: "Export completed", sub: "Case Report.pdf", extra: "May 16, 2026 11:08 AM" },
  { icon: "shieldCheck", color: "text-emerald-400 bg-emerald-500/15", title: "2FA enabled", sub: "May 15, 2026 8:44 AM" },
  { icon: "user", color: "text-blue-400 bg-blue-500/15", title: "Profile updated", sub: "May 14, 2026 6:30 PM" },
];