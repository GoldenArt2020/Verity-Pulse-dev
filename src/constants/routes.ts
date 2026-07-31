import {
  Home,
  Compass,
  FolderKanban,
  Wand2,
  SlidersHorizontal,
  BarChart3,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Discover", href: "/find-opportunity", icon: Compass },
  { label: "Workspace", href: "/projects", icon: FolderKanban },
  { label: "Create", href: "/angle-builder", icon: Wand2 },
  { label: "Optimize", href: "/optimize", icon: SlidersHorizontal },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
] as const;

export const SECONDARY_NAV_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
] as const;