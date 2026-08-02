"use client";

export function TeamAvatarStack({ count, extra }: { count: number; extra?: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="-ml-2 h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted-foreground/20 first:ml-0"
        />
      ))}
      {extra ? (
        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-foreground/80">
          +{extra}
        </div>
      ) : null}
    </div>
  );
}