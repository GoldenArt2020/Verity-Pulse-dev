"use client";

import { useRouter } from "next/navigation";
import { CaseVisual, type CaseCategory } from "./CaseVisual";

interface ContinueItem {
  id: string;
  name: string;
  category: CaseCategory;
  description?: string;
  phase: string;
  phaseColor: string;
  progress: number;
  lastEdited: string;
  href: string;
}

export function ContinueWorking({ items }: { items: ContinueItem[] }) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Continue working
        </p>
        <button
          onClick={() => router.push("/workspace")}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </button>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="group flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative h-28 w-full overflow-hidden">
              <CaseVisual
                category={item.category}
                description={item.description}
                className="h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium text-white"
                style={{ backgroundColor: item.phaseColor }}
              >
                {item.phase}
              </span>
            </div>

            <div className="p-4">
              <p className="truncate font-semibold text-foreground">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.lastEdited}</p>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.progress}%`, background: item.phaseColor }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{item.progress}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}