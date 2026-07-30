"use client";

export function TeamAvatarStack({ count, extra }: { count: number; extra?: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="-ml-2 h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-br from-slate-600 to-slate-700 first:ml-0"
        />
      ))}
      {extra ? (
        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-[10px] font-semibold text-slate-300">
          +{extra}
        </div>
      ) : null}
    </div>
  );
}