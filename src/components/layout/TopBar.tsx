import type { ReactElement } from "react";

interface TopBarProps {
  title: string;
  subtitle: string;
  icon: ReactElement;
}

export function TopBar({ title, subtitle, icon }: TopBarProps) {
  return (
    <div className="border-b border-border bg-background px-8 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}