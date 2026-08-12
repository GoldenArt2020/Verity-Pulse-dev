import {
  Home,
  Compass,
  FolderKanban,
  BarChart3,
  Settings,
  Radio,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "News Alerts", href: "/news-alerts", icon: Radio },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
] as const;

export const SECONDARY_NAV_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
] as const;