"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        aria-pressed={isDark}
        className={`rounded-full p-1.5 transition-colors ${
          isDark ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        aria-pressed={!isDark}
        className={`rounded-full p-1.5 transition-colors ${
          !isDark ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>
    </div>
  );
}