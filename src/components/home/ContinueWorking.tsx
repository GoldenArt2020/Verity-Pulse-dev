"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface ContinueItem {
  id: string;
  name: string;
  phase: string;
  progress: number;
  lastEdited: string;
  imageUrl: string;
  href: string;
}

export function ContinueWorking({ items }: { items: ContinueItem[] }) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Continue working
        </p>
        <button
          onClick={() => router.push("/workspace")}
          className="text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="group flex w-full items-center gap-4 py-5 text-left transition-colors hover:bg-slate-50"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <Image src={item.imageUrl} alt="" fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">{item.phase}</p>
            </div>

            <div className="hidden w-40 items-center gap-2 sm:flex">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{item.progress}%</span>
            </div>

            <p className="hidden w-32 text-right text-xs text-slate-400 md:block">
              {item.lastEdited}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}