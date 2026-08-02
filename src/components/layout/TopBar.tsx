import type { ReactElement } from "react";

interface TopBarProps {
  title: string;
  subtitle: string;
  icon: ReactElement;
}

export function TopBar({ title, subtitle, icon }: TopBarProps) {
  return (
    <div className="border-b border-slate-100 bg-white px-8 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          {icon}
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}